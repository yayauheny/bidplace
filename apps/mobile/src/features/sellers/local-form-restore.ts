import { useCallback, useEffect, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import {
  clearFormDraft,
  createDraftWriter,
  formDraftKey,
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
 * envelope is schema-checked, each field is accepted only when its JSON
 * shape matches the form's own default for that field, and unfinished
 * intermediate values (a half-typed email or year) restore fine. Business
 * validation stays with the server save/submit path.
 */

// Shape of the defaults captured on first render — the type oracle for
// per-field storage checks.
type FieldShape = Record<string, unknown>;

function sameStorageShape(stored: unknown, reference: unknown): boolean {
  if (Array.isArray(reference)) {
    if (!Array.isArray(stored)) return false;
    if (stored.length === 0 || reference.length === 0) return true;
    return sameStorageShape(stored[0], reference[0]);
  }
  if (reference !== null && typeof reference === 'object') {
    return stored !== null && typeof stored === 'object';
  }
  return typeof stored === typeof reference;
}

const storedDraftEnvelopeSchema = z.object({
  base: z.string().nullable(),
  values: z.record(z.string(), z.unknown()),
});

type StoredDraftEnvelope = z.infer<typeof storedDraftEnvelopeSchema>;

type RestoreInput<TValues extends Record<string, unknown>> = {
  form: UseFormReturn<TValues>;
  accountId: string | null;
  scope: string;
  entityId: string;
  /** Token of the server revision the current form values came from. */
  baseToken: string | null;
  /** Server values the form was last reset from; null for a new entity. */
  serverValues: TValues | null;
  canWrite: () => boolean;
};

export function useLocalFormRestore<TValues extends Record<string, unknown>>({
  form,
  accountId,
  scope,
  entityId,
  baseToken,
  serverValues,
  canWrite,
}: RestoreInput<TValues>) {
  const writerRef = useRef(createDraftWriter());
  const accountRef = useRef(accountId);
  const entityRef = useRef(entityId);
  const baseRef = useRef<string | null>(baseToken);
  const canWriteRef = useRef(canWrite);
  accountRef.current = accountId;
  entityRef.current = entityId;
  baseRef.current = baseToken;
  canWriteRef.current = canWrite;

  // Defaults captured before any hydration reset: they tell a string field
  // from an array field without copying the business schema.
  const fieldShapes = useRef<FieldShape | null>(null);
  if (fieldShapes.current === null) {
    fieldShapes.current = form.getValues() as FieldShape;
  }

  const currentKey = useCallback(
    () =>
      accountRef.current
        ? formDraftKey(accountRef.current, scope, entityRef.current)
        : null,
    [scope],
  );

  // Live write-through of edits while typing.
  useEffect(() => {
    const writer = writerRef.current;
    const subscription = form.watch(() => {
      writer.schedule(() => {
        const key = currentKey();
        if (!key || !canWriteRef.current()) return;
        writeFormDraft(key, {
          base: baseRef.current,
          values: form.getValues(),
        });
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
    const stored = readFormDraft<StoredDraftEnvelope>(key, storedDraftEnvelopeSchema);
    if (!stored) return;
    const expectedBase = entityRef.current === 'new' ? null : baseToken;
    if (entityRef.current !== 'new' && expectedBase === null) return;
    if (stored.base !== expectedBase) {
      // Server moved on (save from another tab/device); the newer server
      // state wins and the stale draft is dropped.
      clearFormDraft(key);
      return;
    }
    const current = form.getValues() as FieldShape;
    const server = serverSnapshot ? (JSON.parse(serverSnapshot) as FieldShape) : null;
    const matchesServer = server
      ? JSON.stringify(current) === serverSnapshot
      : !form.formState.isDirty;
    if (!matchesServer || !stored.values) return;
    const shapes = fieldShapes.current ?? {};
    for (const [field, value] of Object.entries(stored.values)) {
      if (!(field in current)) continue;
      if (!sameStorageShape(value, shapes[field])) continue;
      if (JSON.stringify(current[field]) === JSON.stringify(value)) continue;
      form.setValue(field as never, value as never, {
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
        writeFormDraft(formDraftKey(accountRef.current!, scope, newEntityId), {
          base: newBaseToken,
          values: form.getValues(),
        });
        clearFormDraft(key);
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

  return { noteEntityCreated, clearDraft };
}
