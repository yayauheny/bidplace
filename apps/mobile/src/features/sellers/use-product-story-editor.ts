import { useEffect, useRef, useState } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { StoryBlock } from '@bidplace/contracts';
import { STORY_LIMITS, storyWriteRequestSchema } from '@bidplace/contracts';

import type { ApiClient } from '@bidplace/api-client';

import {
  DRAFT_STORAGE_ERROR_MESSAGE,
  clearFormDraft,
  createDraftWriter,
  draftWriteNeedsWarning,
  readFormDraft,
  writeFormDraft,
} from '../../lib/local-form-draft';
import {
  captureDraftWriteLease,
  draftWriteLeaseIsValid,
} from '../../lib/query-cache';

export type { EditableStoryBlock } from './story-local-draft';
import { storyLocalDraftSchema, storyDraftKey, storyDraftRecoveryKey, storedBlocksOf, draftTextOf, restoreV2, moveStoredDraft, writeBlocks, type StoryLocalDraft, type EditableStoryBlock } from './story-local-draft';

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
  if (revisionId === undefined || storyRevisionId === undefined)
    return 'foreign';
  return storyRevisionId === revisionId ? 'belongs' : 'foreign';
}

type DraftState = {
  identity: string;
  token: number;
  blocks: EditableStoryBlock[];
  dirty: boolean;
  saving: boolean;
  uploading: boolean;
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
    saving: false,
    uploading: false,
    error: null,
    serverHydrated: story !== undefined,
    awaitingOwnerSnapshot: false,
    storageError: null,
    recoveryText: null,
  };
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
  const initialOwnership = snapshotOwnership(
    story,
    revisionId,
    storyRevisionId,
  );
  const [state, setState] = useState<DraftState>(() => ({
    ...fromServer(identity, initialOwnership === 'belongs' ? story : undefined),
    awaitingOwnerSnapshot: initialOwnership === 'foreign',
  }));
  const current = useRef(state);
  const outstanding = useRef<Promise<boolean> | null>(null);
  const retry = useRef<{ snapshot: string; key: string } | null>(null);
  const pendingImage = useRef<{ image: Blob; key: string } | null>(null);
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
    const text = recovery
      ? draftTextOf(recovery)
      : (recoverySourceText ?? null);
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

    let recoverySourceText: string | null = null;
    const unscopedKey = storyDraftKey(account, productId, undefined);
    if (revision && unscopedKey && unscopedKey !== activeKey) {
      const unscoped = readFormDraft(unscopedKey, storyLocalDraftSchema);
      if (unscoped && moveStoredDraft(unscopedKey, storyDraftRecoveryKey(account, productId, revision)) === 'kept-source') {
        recoverySourceText = draftTextOf(unscoped);
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
        const restored = restoreV2(base, stored);
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
        !(previous.saving || previous.uploading) &&
        previous.serverHydrated &&
        !snapshotBelongs
      ) {
        // The owner query still serves a snapshot of another (usually the
        // previous) revision — e.g. one that predates the confirmed save. It
        // must not be presented as the new revision's story: keep the
        // confirmed blocks until the owner's data for this revision arrives.
        // Belonging is decided by revisionId, never by comparing tokens
        // across revisions. The blocks stay visible but waiting: they must
        // not be edited or sent under the new revision's identity.
        confirmedSave.current = null;
        replace({ ...previous, identity, awaitingOwnerSnapshot: true });
        // restoredFor intentionally stays on the old identity: when a
        // snapshot that belongs to this revision arrives, the restore below
        // hydrates it.
        return;
      }
      confirmedSave.current = null;
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
      !(previous.saving || previous.uploading) &&
      story.storyToken > previous.token
    ) {
      // A newer token within the same revision is an external save; it wins.
      confirmedSave.current = null;
      replace(fromServer(identity, story));
    } else if (
      story &&
      !previous.dirty &&
      !(previous.saving || previous.uploading) &&
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
      previous.saving ||
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

  const addText = (
    type: 'HEADING' | 'PARAGRAPH',
    text = '',
    key: string = crypto.randomUUID(),
  ) => {
    const count = current.current.blocks.filter(
      (block) => block.type !== 'IMAGE',
    ).length;
    if (count >= STORY_LIMITS.maxTextBlocks) return;
    change((blocks) => [...blocks, { key, type, text }]);
    return current.current.blocks.some((block) => block.key === key)
      ? key
      : undefined;
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
      (current.current.saving || current.current.uploading) ||
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
        error: 'Фото истории должно быть не больше 10 МиБ.',
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
    replace({ ...previous, uploading: true, error: null });
    try {
      const result = await api.images.addStoryImage(
        productId,
        pending.image,
        pending.key,
      );
      if (current.current.identity !== identity) return false;
      pendingImage.current = null;
      replace({
        ...current.current,
        uploading: false,
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
          uploading: false,
          error:
            'Не удалось загрузить фото. Повторите загрузку без повторного выбора файла.',
        });
      }
      return false;
    }
  };

  const save = async (): Promise<boolean> => {
    let before = current.current;
    if (before.identity !== identity || (before.saving || before.uploading) || !productId)
      return false;
    // Waiting for the owner's snapshot of this revision: nothing here may
    // reach the API, even if a dirty draft predates the identity change.
    if (before.awaitingOwnerSnapshot || outstanding.current) return false;
    if (pendingImage.current) {
      if (!(await addImage())) return false;
      before = current.current;
      if (
        before.identity !== identity ||
        before.awaitingOwnerSnapshot ||
        canChange?.() === false
      ) return false;
    }
    if (!before.dirty) return true;
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
    replace({ ...before, saving: true, error: null });
    const task = (async () => {
      try {
        const result = await api.products.replaceCreation(productId, request);
        if (current.current.identity !== identity) return false;
        retry.current = null;
        const saved = result.blocks.map((block, index) =>
          editableBlock(
            block,
            before.blocks.filter(
              (item) => item.type === 'IMAGE' || Boolean(item.text.trim()),
            )[index]?.key ?? block.id,
          ),
        );
        replace({
          ...current.current,
          token: result.storyToken,
          blocks: saved,
          dirty: false,
          saving: false,
          uploading: false,
        });
        confirmedSave.current = {
          revisionId: revisionRef.current ?? null,
          storyToken: result.storyToken,
        };
        // change() blocks input while pending, so the confirmed response is
        // the whole local operation — drop the stored copy for this identity.
        clearLocalDraft();
        onSaved?.(result);
        return true;
      } catch {
        if (current.current.identity === identity) {
          replace({
            ...current.current,
            saving: false,
          uploading: false,
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
    canAddText: state.blocks.filter((block) => block.type !== 'IMAGE').length < STORY_LIMITS.maxTextBlocks,
    canAddImage: state.blocks.filter((block) => block.type === 'IMAGE').length < STORY_LIMITS.maxImages,
    dirty: state.dirty,
    saving: state.saving,
    uploading: state.uploading,
    error: state.error,
    storageError: state.storageError,
    recoveryText: state.recoveryText,
    retryUpload: pendingImage.current !== null,
    // Synchronous read for guard effects: rendered dirty/pending can lag one
    // commit behind when a save response lands before the effect phase.
    isEffectivelyClean: () =>
      !current.current.dirty && !(current.current.saving || current.current.uploading),
    addText,
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
