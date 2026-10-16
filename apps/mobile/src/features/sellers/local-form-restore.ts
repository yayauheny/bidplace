import { useCallback, useEffect, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import {
  DRAFT_STORAGE_ERROR_MESSAGE,
  accountDraftEpoch,
  clearFormDraft,
  createDraftWriter,
  formDraftKey,
  probeDraftStorage,
  readFormDraft,
  writeFormDraft,
} from '../../lib/local-form-draft';

/**
 * Local draft restore for the two owner forms (product draft, seller
 * application). Live edits are written to browser storage debounced; on load
 * a draft is applied on top of the server values only when it was typed on
 * top of the same server revision that was just hydrated — a newer server
 * state wins, matching the accepted multi-device rule.
 *
 * The stored payload is validated as data, not as a submittable form: the
 * envelope is schema-checked, each field is accepted only when it parses
 * against the field owner's raw storage schema (plain strings/arrays — no
 * business limits), so unfinished intermediate values (a half-typed email or
 * year) restore fine while a corrupt element drops just that field and its
 * valid neighbours still restore. Business validation stays with the server
 * save/submit path.
 */

const storedDraftEnvelopeSchema = z.object({
  base: z.string().nullable(),
  values: z.record(z.string(), z.unknown()),
});

type StoredDraftEnvelope = z.infer<typeof storedDraftEnvelopeSchema>;

// Raw per-field parsers owned by the form modules (JSON shapes only).
export type DraftFieldsSchema = z.ZodObject<Record<string, z.ZodTypeAny>>;

type RestoreInput<TValues extends Record<string, unknown>> = {
  form: UseFormReturn<TValues>;
  accountId: string | null;
  scope: string;
  entityId: string;
  /** Token of the server revision the current form values came from. */
  baseToken: string | null;
  /** Server values the form was last reset from; null for a new entity. */
  serverValues: TValues | null;
  /** Raw storage-level field parsers from the form owner module. */
  fields: DraftFieldsSchema;
  canWrite: () => boolean;
};

export function useLocalFormRestore<TValues extends Record<string, unknown>>({
  form,
  accountId,
  scope,
  entityId,
  baseToken,
  serverValues,
  fields,
  canWrite,
}: RestoreInput<TValues>) {
  const writerRef = useRef(createDraftWriter());
  const accountRef = useRef(accountId);
  const entityRef = useRef(entityId);
  const baseRef = useRef<string | null>(baseToken);
  const canWriteRef = useRef(canWrite);
  const fieldsRef = useRef(fields);
  accountRef.current = accountId;
  entityRef.current = entityId;
  baseRef.current = baseToken;
  canWriteRef.current = canWrite;
  fieldsRef.current = fields;

  const currentKey = useCallback(
    () =>
      accountRef.current
        ? formDraftKey(accountRef.current, scope, entityRef.current)
        : null,
    [scope],
  );

  // Live write-through of edits while typing.
  const [storageError, setStorageError] = useState<string | null>(null);

  // Broken storage (quota/denied) means writes fail; a runtime without Web
  // Storage (native) simply has no drafts — no warning needed there.
  useEffect(() => {
    if (probeDraftStorage() === 'failed')
      setStorageError(DRAFT_STORAGE_ERROR_MESSAGE);
  }, []);

  useEffect(() => {
    const writer = writerRef.current;
    const subscription = form.watch(() => {
      const account = accountRef.current;
      const epoch = account ? accountDraftEpoch(account) : null;
      writer.schedule(() => {
        // A logout cleared this account's drafts while the write was pending.
        if (account === null || accountDraftEpoch(account) !== epoch) return;
        const key = currentKey();
        if (!key || !canWriteRef.current()) return;
        if (!form.formState.isDirty) {
          // Clean form: nothing unsaved remains, so the local copy goes away
          // instead of being repersisted after a confirmed save.
          clearFormDraft(key);
          return;
        }
        const written = writeFormDraft(key, {
          base: baseRef.current,
          values: form.getValues(),
        });
        setStorageError(written === 'ok' ? null : DRAFT_STORAGE_ERROR_MESSAGE);
      });
    });
    return () => {
      // Flush the last keystrokes before unmount; a closed session cancels.
      if (canWriteRef.current()) writer.flush();
      else writer.cancel();
      subscription.unsubscribe();
    };
  }, [form, currentKey]);

  // Restore: only when the draft was typed on top of the hydrated revision.
  const serverSnapshot = serverValues ? JSON.stringify(serverValues) : null;
  useEffect(() => {
    const key = currentKey();
    if (!key) return;
    const stored = readFormDraft<StoredDraftEnvelope>(
      key,
      storedDraftEnvelopeSchema,
    );
    if (!stored) return;
    const expectedBase = entityRef.current === 'new' ? null : baseToken;
    if (entityRef.current !== 'new' && expectedBase === null) return;
    if (stored.base !== expectedBase) {
      // Server moved on (save from another tab/device); the newer server
      // state wins and the stale draft is dropped.
      clearFormDraft(key);
      return;
    }
    const current = form.getValues() as Record<string, unknown>;
    const server = serverSnapshot
      ? (JSON.parse(serverSnapshot) as Record<string, unknown>)
      : null;
    const matchesServer = server
      ? JSON.stringify(current) === serverSnapshot
      : !form.formState.isDirty;
    if (!matchesServer || !stored.values) return;
    for (const [field, value] of Object.entries(stored.values)) {
      const fieldSchema = fieldsRef.current.shape[field];
      if (!fieldSchema) continue;
      // A field that fails its raw parser is dropped whole; its valid
      // neighbours still restore.
      const parsed = fieldSchema.safeParse(value);
      if (!parsed.success) continue;
      if (JSON.stringify(current[field]) === JSON.stringify(parsed.data))
        continue;
      form.setValue(field as never, parsed.data as never, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: false,
      });
    }
    // The watch subscription persists the restored draft under the same key.
  }, [currentKey, baseToken, entityId, form, serverSnapshot]);

  const noteEntityCreated = useCallback(
    (newEntityId: string, newBaseToken: string | null) => {
      const writer = writerRef.current;
      const key = currentKey();
      writer.flush();
      if (key && canWriteRef.current()) {
        const written = writeFormDraft(
          formDraftKey(accountRef.current!, scope, newEntityId),
          {
            base: newBaseToken,
            values: form.getValues(),
          },
        );
        // The old 'new' draft goes away only when the copy under the real id
        // landed; otherwise the only snapshot would be destroyed.
        if (written === 'ok') clearFormDraft(key);
        else setStorageError(DRAFT_STORAGE_ERROR_MESSAGE);
      }
      entityRef.current = newEntityId;
      baseRef.current = newBaseToken;
    },
    [currentKey, form, scope],
  );

  const clearDraft = useCallback(() => {
    writerRef.current.cancel();
    const key = currentKey();
    if (key) clearFormDraft(key);
  }, [currentKey]);

  return { noteEntityCreated, clearDraft, storageError };
}
