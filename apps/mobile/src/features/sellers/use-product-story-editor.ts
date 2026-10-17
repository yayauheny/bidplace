import { useEffect, useRef, useState } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { StoryBlock, StoryWriteRequest } from '@bidplace/contracts';
import { STORY_LIMITS, storyWriteRequestSchema } from '@bidplace/contracts';
import { z } from 'zod';

import type { ApiClient } from '@bidplace/api-client';

import {
  DRAFT_STORAGE_ERROR_MESSAGE,
  clearFormDraft,
  createDraftWriter,
  draftWriteNeedsWarning,
  formDraftKey,
  readFormDraft,
  writeFormDraft,
} from '../../lib/local-form-draft';
import {
  captureDraftWriteLease,
  draftWriteLeaseIsValid,
} from '../../lib/query-cache';

export type EditableStoryBlock = StoryWriteRequest['blocks'][number] & {
  key: string;
};

/**
 * Local restore covers unfinished story state; uploaded images stay
 * server-side — the draft keeps only their ids and order, never bytes.
 * v2 blocks carry stable keys (server block id when persisted, client key
 * otherwise) so restore matches by identity and order, not by content.
 */
const storyTextBlockSchema = z.object({
  key: z.string(),
  type: z.enum(['HEADING', 'PARAGRAPH']),
  text: z.string(),
});

const storyImageBlockSchema = z.object({
  key: z.string(),
  type: z.literal('IMAGE'),
  mediaAssetId: z.string(),
  altText: z.string().nullable(),
});

const storyStoredBlockSchema = z.discriminatedUnion('type', [
  storyTextBlockSchema,
  storyImageBlockSchema,
]);

export const storyLocalDraftSchema = z.object({
  v: z.literal(2).optional(),
  // The server revision this draft belongs to. A draft without a revision id
  // is ambiguous (written before revision tracking) and must never be applied
  // to a concrete revision.
  revisionId: z.string().optional(),
  token: z.number(),
  blocks: z.array(storyStoredBlockSchema),
});

export type StoryLocalDraft = z.infer<typeof storyLocalDraftSchema>;

function storyDraftEntityId(
  productId: string | undefined,
  revisionId: string | undefined,
): string {
  // The creation flow has no product/revision yet: it keeps the single
  // revision-less 'new' surface that migrateStoryDraft moves after create.
  if (!productId) return 'new';
  // A product draft always belongs to one editing revision; the revision-less
  // plain product key stays the legacy surface that is migrated on read.
  return revisionId ? `${productId}@${revisionId}` : productId;
}

function storyDraftKey(
  accountId: string | null,
  productId: string | undefined,
  revisionId: string | undefined,
) {
  if (!accountId) return null;
  return formDraftKey(
    accountId,
    'product-story',
    storyDraftEntityId(productId, revisionId),
  );
}

/** Revision-less key written before drafts were scoped per revision. */
function storyDraftLegacyKey(
  accountId: string,
  productId: string | undefined,
): string {
  return formDraftKey(accountId, 'product-story', productId ?? 'new');
}

/**
 * A draft that must never be applied automatically (another revision's copy,
 * or one written before revision tracking) is kept here, one per revision
 * scope, so live writes and confirmed saves cannot destroy the only copy.
 * Logout clears it with the account prefix; the notice offers the text.
 */
function storyDraftRecoveryKey(
  accountId: string,
  productId: string | undefined,
  revisionId: string | undefined,
): string {
  return `${storyDraftKey(accountId, productId, revisionId)}~recovery`;
}

function storedBlocksOf(blocks: readonly EditableStoryBlock[]) {
  return blocks.map((block) => {
    // Server ids survive a remount; client keys identify not-yet-saved blocks.
    const key = block.id ?? block.key;
    if (block.type === 'IMAGE') {
      return {
        key,
        type: 'IMAGE' as const,
        mediaAssetId: block.mediaAssetId,
        altText: block.altText ?? null,
      };
    }
    return {
      key,
      type: block.type as 'HEADING' | 'PARAGRAPH',
      text: block.text,
    };
  });
}

type StorySnapshot = { storyToken: number; blocks: StoryBlock[] };

/**
 * Belonging of a server snapshot to the active revision. 'absent' means there
 * is nothing to adopt yet (a new work before its first server save): input
 * stays open. 'foreign' means a snapshot exists but its attribution is
 * missing or names another revision: the editor waits for the owner's data
 * and refuses edits, uploads and saves. One predicate for the initial
 * baseline, every hydrate/refetch branch and the change/save/upload guards.
 */
function snapshotOwnership(
  story: StorySnapshot | undefined,
  revisionId: string | undefined,
  storyRevisionId: string | undefined,
): 'absent' | 'foreign' | 'belongs' {
  if (!story) return 'absent';
  if (revisionId === undefined || storyRevisionId === undefined) return 'foreign';
  return storyRevisionId === revisionId ? 'belongs' : 'foreign';
}

type DraftState = {
  identity: string;
  token: number;
  blocks: EditableStoryBlock[];
  dirty: boolean;
  pending: boolean;
  error: string | null;
  /** True once this state incorporates a real server story snapshot. */
  serverHydrated: boolean;
  /**
   * True while a server snapshot exists but does not belong to the active
   * revision (owner query has not caught up): change/save/upload are
   * refused until the matching snapshot arrives. Distinct from a new work
   * before its first server save, where input stays open.
   */
  awaitingOwnerSnapshot: boolean;
  /**
   * Set when a stored draft was moved to the recovery namespace because it
   * belongs to a different server revision (or has no revision id): it is
   * never applied to this revision. Also set when a local write fails, with
   * the generic storage message.
   */
  storageError: string | null;
  /**
   * Plain text of the recovered copy behind the storageError notice, so the
   * author can copy it out without DevTools. Null when nothing was kept.
   */
  recoveryText: string | null;
};

const RECOVERY_NOTICE =
  'Локальная копия истории относится к другой редакции работы и не может быть восстановлена автоматически.';

function draftTextOf(stored: StoryLocalDraft): string | null {
  const text = stored.blocks
    .map((block) => (block.type === 'IMAGE' ? '' : block.text))
    .filter(Boolean)
    .join('\n\n');
  return text || null;
}

function editableBlock(
  block: StoryBlock,
  key: string = block.id,
): EditableStoryBlock {
  switch (block.type) {
    case 'HEADING':
      return { id: block.id, key, type: block.type, text: block.text };
    case 'PARAGRAPH':
      return { id: block.id, key, type: block.type, text: block.text };
    case 'IMAGE':
      return {
        id: block.id,
        key,
        type: 'IMAGE',
        mediaAssetId: block.mediaAssetId,
        altText: block.altText ?? null,
      };
  }
}

function fromServer(identity: string, story?: StorySnapshot): DraftState {
  return {
    identity,
    token: story?.storyToken ?? 0,
    blocks: (story?.blocks ?? []).map((block) => editableBlock(block)),
    dirty: false,
    pending: false,
    error: null,
    serverHydrated: story !== undefined,
    awaitingOwnerSnapshot: false,
    storageError: null,
    recoveryText: null,
  };
}

function writeBlocks(
  blocks: readonly EditableStoryBlock[],
): StoryWriteRequest['blocks'] {
  return blocks.map((block) => {
    if (block.type === 'IMAGE') {
      return {
        id: block.id,
        type: 'IMAGE',
        mediaAssetId: block.mediaAssetId,
        altText: block.altText ?? null,
      };
    }
    return {
      id: block.id,
      type: block.type,
      text: block.text,
    };
  });
}

export function useProductStoryEditor({
  api,
  productId,
  revisionId,
  storyRevisionId,
  authEpoch,
  accountId,
  queryClient,
  story,
  onSaved,
  canChange,
}: {
  api: ApiClient;
  productId?: string;
  revisionId?: string;
  /**
   * The revision the current `story` snapshot belongs to, as served by the
   * owner query. The hook must not present a snapshot of another revision as
   * this revision's baseline; when the owner has not caught up yet, the
   * snapshot is held, not applied.
   */
  storyRevisionId?: string;
  authEpoch: number;
  accountId: string | null;
  /** Session boundary: owns the local draft write lease (logout/login). */
  queryClient: QueryClient;
  story?: StorySnapshot;
  onSaved?: (story: StorySnapshot) => void;
  canChange?: () => boolean;
}) {
  const identity = `${authEpoch}:${productId ?? ''}:${revisionId ?? ''}`;
  // The baseline is held before mount when the served snapshot does not
  // belong to the active revision: a cold mount must not flash another
  // revision's blocks. A new work without any snapshot is not waiting.
  const initialOwnership = snapshotOwnership(story, revisionId, storyRevisionId);
  const [state, setState] = useState<DraftState>(() => ({
    ...fromServer(identity, initialOwnership === 'belongs' ? story : undefined),
    awaitingOwnerSnapshot: initialOwnership === 'foreign',
  }));
  const current = useRef(state);
  const outstanding = useRef<Promise<boolean> | null>(null);
  const retry = useRef<{ snapshot: string; key: string } | null>(null);
  const pendingImage = useRef<{ image: Blob; key: string } | null>(null);
  const uploaded = useRef<Set<string>>(new Set());
  const writer = useRef(createDraftWriter());
  const accountRef = useRef(accountId);
  const productRef = useRef(productId);
  const revisionRef = useRef(revisionId);
  accountRef.current = accountId;
  productRef.current = productId;
  revisionRef.current = revisionId;
  // Result of the last confirmed own save, tagged with the revision it was
  // applied to. Only this specific operation may reconcile a later refetch
  // against the editor state — never a token comparison across revisions.
  const confirmedSave = useRef<{
    revisionId: string | null;
    storyToken: number;
  } | null>(null);
  const lastEffectRevision = useRef(revisionId);
  const persistedAssets = useRef<Set<string>>(
    new Set(
      (story?.blocks ?? []).flatMap((block) =>
        block.type === 'IMAGE' ? [block.mediaAssetId] : [],
      ),
    ),
  );

  const replace = (next: DraftState) => {
    current.current = next;
    setState(next);
  };

  const persistDraft = () => {
    const account = accountRef.current;
    const key = storyDraftKey(account, productRef.current, revisionRef.current);
    if (!account || !key) return;
    const lease = captureDraftWriteLease(queryClient);
    writer.current.schedule(() => {
      // The session lease (captured at schedule time) is retired when logout
      // begins and reissued only by the next session; a pending write cannot
      // be re-armed by re-scheduling before that.
      if (!draftWriteLeaseIsValid(queryClient, lease)) return;
      const draft: StoryLocalDraft = {
        v: 2,
        revisionId: revisionRef.current,
        token: current.current.token,
        blocks: storedBlocksOf(current.current.blocks),
      };
      const written = writeFormDraft(key, draft);
      const state = current.current;
      if (state.identity === identity) {
        // Only a failing storage API warns; a runtime without Web Storage
        // simply has no browser drafts to promise.
        replace({
          ...state,
          storageError: draftWriteNeedsWarning(written)
            ? DRAFT_STORAGE_ERROR_MESSAGE
            : null,
        });
      }
    });
  };

  /**
   * Moves a stored draft between keys: copy → confirm the write → delete the
   * source. A failed write or a destination already holding a different copy
   * leaves the source untouched, so a migration can never destroy the only
   * copy (quota/denied) nor overwrite a newer draft (A-01).
   */
  const moveStoredDraft = (
    fromKey: string,
    toKey: string,
  ): 'moved' | 'kept-source' | 'nothing' => {
    const stored = readFormDraft(fromKey, storyLocalDraftSchema);
    if (!stored) return 'nothing'; // nothing parseable there; leave it as is
    const existing = readFormDraft(toKey, storyLocalDraftSchema);
    if (existing) {
      if (JSON.stringify(existing) === JSON.stringify(stored)) {
        // Identical copies collapse into the destination; no write needed.
        clearFormDraft(fromKey);
        return 'moved';
      }
      return 'kept-source'; // occupied by a different copy; never overwrite
    }
    if (writeFormDraft(toKey, stored) === 'ok') {
      clearFormDraft(fromKey);
      return 'moved';
    }
    return 'kept-source';
  };

  const withRecoveryNotice = (
    state: DraftState,
    account: string,
    productId: string | undefined,
    revisionId: string | undefined,
    // Text of a copy that could not move to the recovery key; offered from
    // its surviving source so recovery never depends on free quota (A-04).
    recoverySourceText?: string | null,
  ): DraftState => {
    const recovery = readFormDraft(
      storyDraftRecoveryKey(account, productId, revisionId),
      storyLocalDraftSchema,
    );
    const text = recovery ? draftTextOf(recovery) : (recoverySourceText ?? null);
    if (!text) return state;
    return {
      ...state,
      storageError: state.storageError ?? RECOVERY_NOTICE,
      recoveryText: state.recoveryText ?? text,
    };
  };

  const restoreDraft = (
    identityNow: string,
    storySnapshot?: StorySnapshot,
  ): DraftState => {
    const account = accountRef.current;
    const productId = productRef.current;
    const revision = revisionRef.current;
    const activeKey = storyDraftKey(account, productId, revision);
    const base = fromServer(identityNow, storySnapshot);
    if (!account || !activeKey) return base;

    // The revision-less legacy key (written before drafts were scoped per
    // revision) is never applied as-is: a copy of this revision moves to the
    // active key only when that key does not already hold a different draft;
    // anything else goes to the recovery namespace, and an occupied or
    // unwritable destination keeps the source where it is. Without a revision
    // identity (owner query still loading) nothing is moved: a copy migrated
    // into an undefined-revision namespace would be invisible to the loaded
    // revision's restore pass, so a foreign copy is offered from its source
    // in place and migrates once the revision is known.
    const legacyKey = storyDraftLegacyKey(account, productId);
    let recoverySourceText: string | null = null;
    if (revision) {
      if (legacyKey !== activeKey) {
        const legacy = readFormDraft(legacyKey, storyLocalDraftSchema);
        if (legacy) {
          const target =
            legacy.revisionId != null && legacy.revisionId === revision
              ? activeKey
              : storyDraftRecoveryKey(account, productId, revision);
          if (moveStoredDraft(legacyKey, target) === 'kept-source') {
            recoverySourceText = draftTextOf(legacy);
          }
        }
      }
    } else {
      const legacy = readFormDraft(legacyKey, storyLocalDraftSchema);
      if (legacy && legacy.revisionId != null) {
        recoverySourceText = draftTextOf(legacy);
      }
    }

    const stored = readFormDraft(activeKey, storyLocalDraftSchema);
    if (stored && stored.revisionId !== revision) {
      // Cross-tab race: another revision's draft under this revision's key.
      // Keep it as a recovery copy instead of applying or destroying it.
      if (revision) {
        if (
          moveStoredDraft(
            activeKey,
            storyDraftRecoveryKey(account, productId, revision),
          ) === 'kept-source'
        ) {
          recoverySourceText ??= draftTextOf(stored);
        }
      } else if (stored.revisionId != null) {
        recoverySourceText ??= draftTextOf(stored);
      }
    } else if (stored) {
      const serverToken = storySnapshot?.storyToken ?? 0;
      if (stored.token >= serverToken) {
        // The stored draft belongs to this revision and does not predate the
        // server story. (Tokens are only comparable inside one revision.)
        const restored =
          stored.v === 2
            ? restoreV2(base, stored)
            : restoreLegacy(base, stored);
        return withRecoveryNotice(
          restored,
          account,
          productId,
          revision,
          recoverySourceText,
        );
      }
      // A newer server story exists within this revision; the last server
      // save wins.
      clearFormDraft(activeKey);
    }
    return withRecoveryNotice(
      base,
      account,
      productId,
      revision,
      recoverySourceText,
    );
  };

  // v2: blocks match server blocks by stable key, so identity, edits,
  // deletions and reordering restore exactly; server media keeps its id.
  const restoreV2 = (base: DraftState, stored: StoryLocalDraft): DraftState => {
    const serverByKey = new Map(base.blocks.map((block) => [block.key, block]));
    const blocks: EditableStoryBlock[] = [];
    for (const block of stored.blocks) {
      const match = serverByKey.get(block.key);
      if (block.type === 'IMAGE') {
        blocks.push(
          match?.type === 'IMAGE'
            ? { ...match, altText: block.altText ?? null }
            : {
                key: block.key,
                type: 'IMAGE',
                mediaAssetId: block.mediaAssetId,
                altText: block.altText ?? null,
              },
        );
        continue;
      }
      if (match && match.type !== 'IMAGE') {
        blocks.push({ ...match, text: block.text });
        continue;
      }
      blocks.push({ key: block.key, type: block.type, text: block.text });
    }
    const same =
      JSON.stringify(writeBlocks(blocks)) ===
      JSON.stringify(writeBlocks(base.blocks));
    if (same) return base;
    return { ...base, blocks, dirty: true };
  };

  // Legacy text-only payloads cannot record deletions/reordering/images, so
  // they keep the old content-merge semantics; the ambiguity is documented
  // in the wave report rather than guessed.
  const restoreLegacy = (
    base: DraftState,
    stored: StoryLocalDraft,
  ): DraftState => {
    const storedTexts = stored.blocks.filter(
      (block): block is z.infer<typeof storyTextBlockSchema> =>
        block.type !== 'IMAGE',
    );
    if (storedTexts.length === 0) return base;
    const serverCounts = new Map<string, number>();
    for (const block of base.blocks) {
      if (block.type === 'IMAGE') continue;
      const contentKey = `${block.type}:${block.text}`;
      serverCounts.set(contentKey, (serverCounts.get(contentKey) ?? 0) + 1);
    }
    const fresh = storedTexts.filter((block) => {
      const contentKey = `${block.type}:${block.text}`;
      const count = serverCounts.get(contentKey) ?? 0;
      if (count > 0) {
        serverCounts.set(contentKey, count - 1);
        return false;
      }
      return true;
    });
    if (fresh.length === 0) return base;
    return {
      ...base,
      blocks: [
        ...base.blocks,
        ...fresh.map((block) => ({
          key: block.key,
          type: block.type,
          text: block.text,
        })),
      ],
      dirty: true,
    };
  };

  const clearLocalDraft = () => {
    writer.current.cancel();
    const key = storyDraftKey(
      accountRef.current,
      productRef.current,
      revisionRef.current,
    );
    if (key) clearFormDraft(key);
  };

  useEffect(() => {
    return () => {
      // Persist the last text edits on unmount. A closed session already had
      // its pending write cancelled by the identity change above.
      writer.current.flush();
    };
  }, []);

  // One restore attempt per identity, including a plain mount with stable
  // identity (cached server data): otherwise a stored draft is never read.
  const restoredFor = useRef<string | null>(null);

  useEffect(() => {
    const previous = current.current;
    // The snapshot may only become this revision's baseline when the owner
    // query says it belongs to this revision. A snapshot without a revision
    // attribution (loading state) or with another revision's attribution is
    // held, never presented as this revision's story; an absent snapshot
    // imposes no ownership claim, so the local draft restore still runs and
    // a new work stays editable.
    const ownership = snapshotOwnership(story, revisionId, storyRevisionId);
    const snapshotBelongs = ownership !== 'foreign';
    if (previous.identity !== identity) {
      writer.current.cancel();
      uploaded.current = new Set();
      outstanding.current = null;
      pendingImage.current = null;
      retry.current = null;
      const revisionChanged = lastEffectRevision.current !== revisionId;
      lastEffectRevision.current = revisionId;
      const confirmed = confirmedSave.current;
      if (
        revisionChanged &&
        confirmed &&
        !previous.dirty &&
        !previous.pending &&
        previous.serverHydrated &&
        !snapshotBelongs
      ) {
        // The owner query still serves a snapshot of another (usually the
        // previous) revision — e.g. one that predates the confirmed save. It
        // must not be presented as the new revision's story: keep the
        // confirmed blocks until the owner's data for this revision arrives.
        // Belonging is decided by revisionId, never by comparing tokens
        // across revisions.
        confirmedSave.current = null;
        persistedAssets.current = new Set(
          previous.blocks.flatMap((block) =>
            block.type === 'IMAGE' ? [block.mediaAssetId] : [],
          ),
        );
        replace({ ...previous, identity });
        // restoredFor intentionally stays on the old identity: when a
        // snapshot that belongs to this revision arrives, the restore below
        // hydrates it.
        return;
      }
      confirmedSave.current = null;
      persistedAssets.current = new Set(
        (snapshotBelongs ? (story?.blocks ?? []) : []).flatMap((block) =>
          block.type === 'IMAGE' ? [block.mediaAssetId] : [],
        ),
      );
      if (snapshotBelongs) {
        restoredFor.current = identity;
        replace(restoreDraft(identity, story));
      } else {
        // The owner does not serve this revision yet: hold an empty,
        // not-yet-hydrated baseline instead of adopting another revision's
        // story, and refuse edits/uploads/saves until the matching snapshot
        // arrives. The recovery notice survives the identity change.
        replace({
          ...fromServer(identity, undefined),
          storageError: previous.storageError,
          recoveryText: previous.recoveryText,
          awaitingOwnerSnapshot: true,
        });
      }
    } else if (restoredFor.current !== identity) {
      if (story && !snapshotBelongs) {
        // The owner still serves another revision's snapshot: stay in the
        // held waiting state instead of hydrating a foreign baseline.
        return;
      }
      restoredFor.current = identity;
      replace(restoreDraft(identity, story));
    } else if (
      story &&
      snapshotBelongs &&
      !previous.dirty &&
      !previous.pending &&
      story.storyToken > previous.token
    ) {
      // A newer token within the same revision is an external save; it wins.
      confirmedSave.current = null;
      persistedAssets.current = new Set(
        story.blocks.flatMap((block) =>
          block.type === 'IMAGE' ? [block.mediaAssetId] : [],
        ),
      );
      replace(fromServer(identity, story));
    } else if (
      story &&
      !previous.dirty &&
      !previous.pending &&
      confirmedSave.current &&
      confirmedSave.current.revisionId === revisionId &&
      story.storyToken === previous.token
    ) {
      // The owner refetch carries exactly the confirmed save: the owner has
      // caught up, so the confirmation is spent. (Same-revision comparison.)
      confirmedSave.current = null;
    }
  }, [identity, revisionId, storyRevisionId, story?.storyToken]);

  const change = (
    update: (blocks: EditableStoryBlock[]) => EditableStoryBlock[],
  ) => {
    const previous = current.current;
    if (
      previous.identity !== identity ||
      previous.pending ||
      previous.awaitingOwnerSnapshot ||
      canChange?.() === false
    )
      return;
    replace({
      ...previous,
      blocks: update(previous.blocks),
      dirty: true,
      error: null,
    });
    retry.current = null;
    confirmedSave.current = null;
    persistDraft();
  };

  const addText = (type: 'HEADING' | 'PARAGRAPH') => {
    const count = current.current.blocks.filter(
      (block) => block.type !== 'IMAGE',
    ).length;
    if (count >= STORY_LIMITS.maxTextBlocks) return;
    change((blocks) => [
      ...blocks,
      { key: crypto.randomUUID(), type, text: '' },
    ]);
  };

  const addGalleryImage = (mediaAssetId: string) => {
    const count = current.current.blocks.filter(
      (block) => block.type === 'IMAGE',
    ).length;
    if (count >= STORY_LIMITS.maxImages) return;
    change((blocks) => [
      ...blocks,
      {
        key: crypto.randomUUID(),
        type: 'IMAGE',
        mediaAssetId,
        altText: null,
      },
    ]);
  };

  const editText = (key: string, text: string) =>
    change((blocks) =>
      blocks.map((block) =>
        block.key === key && block.type !== 'IMAGE'
          ? { ...block, text }
          : block,
      ),
    );

  const editAlt = (key: string, altText: string) =>
    change((blocks) =>
      blocks.map((block) =>
        block.key === key && block.type === 'IMAGE'
          ? { ...block, altText: altText || null }
          : block,
      ),
    );

  const remove = (key: string) =>
    change((blocks) => blocks.filter((block) => block.key !== key));

  const move = (key: string, direction: -1 | 1) =>
    change((blocks) => {
      const index = blocks.findIndex((block) => block.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= blocks.length) return blocks;
      const next = [...blocks];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });

  const addImage = async (image?: Blob): Promise<boolean> => {
    if (
      !productId ||
      current.current.pending ||
      current.current.identity !== identity ||
      current.current.awaitingOwnerSnapshot ||
      canChange?.() === false
    )
      return false;
    if (
      current.current.blocks.filter((block) => block.type === 'IMAGE').length >=
      STORY_LIMITS.maxImages
    ) {
      replace({
        ...current.current,
        error: 'Достигнут лимит изображений истории.',
      });
      return false;
    }
    if (image && image.size > STORY_LIMITS.maxFileBytes) {
      replace({
        ...current.current,
        error: 'Фото истории должно быть не больше 5 МиБ.',
      });
      return false;
    }
    if (image && pendingImage.current) {
      replace({
        ...current.current,
        error: 'Сначала повторите предыдущую загрузку.',
      });
      return false;
    }
    const pending =
      pendingImage.current ??
      (image ? { image, key: crypto.randomUUID() } : null);
    if (!pending) return false;
    pendingImage.current = pending;
    const previous = current.current;
    replace({ ...previous, pending: true, error: null });
    try {
      const result = await api.images.addStoryImage(
        productId,
        pending.image,
        pending.key,
      );
      if (current.current.identity !== identity) return false;
      pendingImage.current = null;
      uploaded.current.add(result.mediaAssetId);
      replace({
        ...current.current,
        pending: false,
        dirty: true,
        blocks: [
          ...current.current.blocks,
          {
            key: crypto.randomUUID(),
            type: 'IMAGE',
            mediaAssetId: result.mediaAssetId,
            altText: null,
          },
        ],
      });
      persistDraft();
      return true;
    } catch {
      if (current.current.identity === identity) {
        replace({
          ...current.current,
          pending: false,
          error:
            'Не удалось загрузить фото. Повторите загрузку без повторного выбора файла.',
        });
      }
      return false;
    }
  };

  const save = async (): Promise<boolean> => {
    const before = current.current;
    if (before.identity !== identity || before.pending || !productId)
      return false;
    // Waiting for the owner's snapshot of this revision: nothing here may
    // reach the API, even if a dirty draft predates the identity change.
    if (before.awaitingOwnerSnapshot) return false;
    if (!before.dirty) return true;
    if (outstanding.current) return false;
    const blocks = writeBlocks(before.blocks);
    const parsed = storyWriteRequestSchema.safeParse({
      storyToken: before.token,
      blocks,
    });
    if (!parsed.success) {
      replace({
        ...before,
        error:
          'Проверьте текст и ограничения блоков истории перед сохранением.',
      });
      return false;
    }
    const snapshot = JSON.stringify(parsed.data.blocks);
    if (!retry.current || retry.current.snapshot !== snapshot) {
      retry.current = { snapshot, key: crypto.randomUUID() };
    }
    const request = { ...parsed.data, idempotencyKey: retry.current.key };
    replace({ ...before, pending: true, error: null });
    const task = (async () => {
      try {
        const result = await api.products.replaceCreation(productId, request);
        if (current.current.identity !== identity) return false;
        retry.current = null;
        const saved = result.blocks.map((block, index) =>
          editableBlock(block, before.blocks[index]?.key ?? block.id),
        );
        const removedAssets = [
          ...new Set([...persistedAssets.current, ...uploaded.current]),
        ].filter(
          (id) =>
            !result.blocks.some(
              (block) => block.type === 'IMAGE' && block.mediaAssetId === id,
            ),
        );
        persistedAssets.current = new Set(
          result.blocks.flatMap((block) =>
            block.type === 'IMAGE' ? [block.mediaAssetId] : [],
          ),
        );
        replace({
          ...current.current,
          token: result.storyToken,
          blocks: saved,
          dirty: false,
          pending: false,
        });
        confirmedSave.current = {
          revisionId: revisionRef.current ?? null,
          storyToken: result.storyToken,
        };
        // change() blocks input while pending, so the confirmed response is
        // the whole local operation — drop the stored copy for this identity.
        clearLocalDraft();
        onSaved?.(result);
        for (const assetId of removedAssets) {
          try {
            await api.images.removeStoryImage(productId, assetId);
            uploaded.current.delete(assetId);
          } catch {
            // A failed hold release cannot undo a successfully saved story.
          }
        }
        return true;
      } catch {
        if (current.current.identity === identity) {
          replace({
            ...current.current,
            pending: false,
            error:
              'История не сохранена. При конфликте с другой вкладкой сохраните текст и обновите страницу.',
          });
        }
        return false;
      }
    })();
    outstanding.current = task;
    void task.finally(() => {
      if (outstanding.current === task) outstanding.current = null;
    });
    return task;
  };

  const reportError = (message: string) => {
    if (current.current.identity !== identity) return;
    replace({ ...current.current, error: message });
  };

  return {
    blocks: state.blocks,
    dirty: state.dirty,
    pending: state.pending,
    error: state.error,
    storageError: state.storageError,
    recoveryText: state.recoveryText,
    retryUpload: pendingImage.current !== null,
    // Synchronous read for guard effects: rendered dirty/pending can lag one
    // commit behind when a save response lands before the effect phase.
    isEffectivelyClean: () =>
      !current.current.dirty && !current.current.pending,
    addText,
    addGalleryImage,
    editText,
    editAlt,
    remove,
    move,
    addImage,
    reportError,
    save,
  };
}

export type ProductStoryEditor = ReturnType<typeof useProductStoryEditor>;
