import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { useMutation, type QueryClient } from '@tanstack/react-query';
import type { UseFormReturn } from 'react-hook-form';

import type { Product } from '@bidplace/contracts';

import type { ApiClient } from '@bidplace/api-client';

import {
  applyFormFailure,
  focusFirstFormError,
  getUserFacingErrorMessage,
  readFormFailure,
} from '../../errors';
import { canWritePrivateCache, currentAuthEpoch } from '../../lib/query-cache';
import { persistedFieldOverrides } from './reconcile-saved-fields';
import { invalidateOwnerWorks } from './owner-work-query';
import {
  productDraftFieldOrder,
  productDraftFormSchema,
  productDraftToWriteRequest,
  productToDraftFormValues,
  type ProductDraftFormValues,
} from './product-draft-form';
import type { ProductStoryEditor } from './use-product-story-editor';

type ProductSaveRequest = {
  values: ProductDraftFormValues;
  authEpoch: number;
  generation: number;
};

type ProductSubmitRequest = {
  id: string;
  currentValues: ProductDraftFormValues;
  authEpoch: number;
  generation: number;
};

/**
 * Save-session ownership for the product draft screen: transition/save locks,
 * session operation and save generations, the save and submit mutations, and
 * every persist entry point (ordinary save, transition save, submit).
 */
export function useProductDraftSaveSession({
  api,
  queryClient,
  form,
  productId,
  authEpoch,
  storyEditorSlot,
  retireGuardSlot,
  onSavedProduct,
  onSubmittedProduct,
}: {
  api: ApiClient;
  queryClient: QueryClient;
  form: UseFormReturn<ProductDraftFormValues>;
  productId?: string;
  authEpoch: number;
  storyEditorSlot: RefObject<ProductStoryEditor | null>;
  retireGuardSlot: RefObject<() => Promise<void>>;
  onSavedProduct?: (product: Product) => void;
  onSubmittedProduct?: (
    product: Product,
    isCurrent: () => boolean,
  ) => Promise<void>;
}) {
  const seenAuthEpoch = useRef(authEpoch);
  const persistedProductId = useRef<string | null>(productId ?? null);
  const transitionLock = useRef(false);
  const saveInFlight = useRef(false);
  const pendingSave = useRef<Promise<boolean> | null>(null);
  const saveGeneration = useRef(0);
  const sessionOperation = useRef(0);
  const resetSaveMutation = useRef<() => void>(() => undefined);
  const [inputsLocked, setInputsLocked] = useState(false);
  const [formAlert, setFormAlert] = useState<string | null>(null);
  const persistForTransitionRef = useRef<() => Promise<boolean>>(
    async () => false,
  );

  const beginLockedTransition = () => {
    if (transitionLock.current) return false;
    transitionLock.current = true;
    setInputsLocked(true);
    return true;
  };

  const endLockedTransition = () => {
    transitionLock.current = false;
    setInputsLocked(false);
  };

  useEffect(() => {
    if (seenAuthEpoch.current === authEpoch) return;
    seenAuthEpoch.current = authEpoch;
    sessionOperation.current += 1;
    saveGeneration.current += 1;
    saveInFlight.current = false;
    resetSaveMutation.current();
    setFormAlert(null);
    endLockedTransition();
  }, [authEpoch]);

  const applyPersistedForm = (
    product: Product,
    submitted: ProductDraftFormValues,
  ) => {
    persistedProductId.current = product.id;
    const persisted = productToDraftFormValues(product, undefined, submitted);
    const overrides = persistedFieldOverrides(
      submitted,
      form.getValues(),
      persisted,
    );
    form.reset(persisted);
    for (const field of Object.keys(overrides) as Array<
      keyof ProductDraftFormValues
    >) {
      const value = overrides[field];
      if (value === undefined) continue;
      form.setValue(field, value, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  };

  const invalidateSavedProduct = (savedProductId: string) =>
    invalidateOwnerWorks(queryClient, savedProductId);

  const save = useMutation({
    mutationFn: ({ values }: ProductSaveRequest) => {
      const id = persistedProductId.current;
      const body = productDraftToWriteRequest(values);
      return id ? api.products.update(id, body) : api.products.create(body);
    },
    onSuccess: async ({ product }, request) => {
      if (request.generation !== saveGeneration.current) return;
      if (!canWritePrivateCache(queryClient, request.authEpoch)) return;
      await retireGuardSlot.current();
      if (request.generation !== saveGeneration.current) return;
      if (!canWritePrivateCache(queryClient, request.authEpoch)) return;
      applyPersistedForm(product, request.values);
      onSavedProduct?.(product);
      void invalidateSavedProduct(product.id);
    },
  });
  resetSaveMutation.current = () => save.reset();
  const submit = useMutation({
    mutationFn: async ({
      id,
      currentValues,
      authEpoch: requestEpoch,
      generation,
    }: ProductSubmitRequest) => {
      await api.products.update(id, productDraftToWriteRequest(currentValues));
      if (
        generation !== saveGeneration.current ||
        !canWritePrivateCache(queryClient, requestEpoch)
      ) {
        return null;
      }
      return api.products.submit(id);
    },
    onSuccess: async (result, request) => {
      if (!result) return;
      if (request.generation !== saveGeneration.current) return;
      if (!canWritePrivateCache(queryClient, request.authEpoch)) return;
      await retireGuardSlot.current();
      if (request.generation !== saveGeneration.current) return;
      if (!canWritePrivateCache(queryClient, request.authEpoch)) return;
      applyPersistedForm(result.product, request.currentValues);
      onSavedProduct?.(result.product);
      await onSubmittedProduct?.(
        result.product,
        () =>
          request.generation === saveGeneration.current &&
          canWritePrivateCache(queryClient, request.authEpoch),
      );
    },
  });

  const releaseSave = (generation: number) => {
    if (saveGeneration.current === generation) saveInFlight.current = false;
  };

  const reportFailure = (error: unknown, fallbackMessage: string) => {
    const failure = readFormFailure(error, productDraftFieldOrder);
    if (failure.disposition === 'passthrough') {
      setFormAlert(getUserFacingErrorMessage(error, fallbackMessage));
    } else {
      applyFormFailure(form, failure, productDraftFieldOrder);
      setFormAlert(failure.formMessage);
    }
  };

  const persistCurrentForm = useCallback(
    async (mode: 'ordinary' | 'transition' = 'ordinary') => {
      if (saveInFlight.current) return false;
      if (mode === 'transition') {
        if (!beginLockedTransition()) return false;
      } else if (transitionLock.current) {
        return false;
      }
      const operation = sessionOperation.current;
      const generation = saveGeneration.current + 1;
      saveGeneration.current = generation;
      saveInFlight.current = true;
      let settle: (persisted: boolean) => void = () => undefined;
      const pending = new Promise<boolean>((resolve) => {
        settle = resolve;
      });
      pendingSave.current = pending;
      const snapshot = form.getValues();
      const authEpochAtSave = currentAuthEpoch(queryClient);
      const stillOwnsSave = () =>
        sessionOperation.current === operation &&
        saveGeneration.current === generation &&
        canWritePrivateCache(queryClient, authEpochAtSave);
      setFormAlert(null);
      void (async () => {
        let persisted = false;
        try {
          if (!productDraftFormSchema.safeParse(snapshot).success) {
            await form.trigger();
            if (stillOwnsSave()) {
              focusFirstFormError(form, productDraftFieldOrder);
              if (mode === 'transition') endLockedTransition();
            }
            return;
          }
          await save.mutateAsync({
            values: snapshot,
            authEpoch: authEpochAtSave,
            generation,
          });
          if (!stillOwnsSave()) return;
          persisted = true;
          setFormAlert(null);
        } catch (error) {
          if (stillOwnsSave()) {
            reportFailure(error, 'Не удалось сохранить предмет');
            if (mode === 'transition') endLockedTransition();
          }
        } finally {
          if (sessionOperation.current === operation) releaseSave(generation);
          if (pendingSave.current === pending) pendingSave.current = null;
          settle(persisted);
        }
      })();
      return pending;
    },
    [form, save],
  );

  const persistAll = async (mode: 'ordinary' | 'transition' = 'ordinary') => {
    const storyEditor = storyEditorSlot.current;
    // Never release a route guard while another transition or save is in flight.
    if (transitionLock.current || saveInFlight.current || storyEditor?.pending)
      return false;
    if (form.formState.isDirty) {
      if (!(await persistCurrentForm(mode))) return false;
    } else if (storyEditor?.dirty && mode === 'transition') {
      if (!beginLockedTransition()) return false;
    }
    if (storyEditor?.dirty && !(await storyEditor.save())) {
      setFormAlert(
        'Не удалось сохранить историю создания. Проверьте блоки и повторите сохранение.',
      );
      if (mode === 'transition') endLockedTransition();
      return false;
    }
    return true;
  };
  persistForTransitionRef.current = () => persistAll('transition');

  const submitCurrentForm = async () => {
    const storyEditor = storyEditorSlot.current;
    if (
      saveInFlight.current ||
      storyEditor?.pending ||
      !beginLockedTransition()
    )
      return;
    const generation = saveGeneration.current + 1;
    saveGeneration.current = generation;
    saveInFlight.current = true;
    const id = persistedProductId.current;
    if (!id) {
      releaseSave(generation);
      endLockedTransition();
      return;
    }
    const snapshot = form.getValues();
    const authEpochAtSubmit = currentAuthEpoch(queryClient);
    const operation = sessionOperation.current;
    if (!productDraftFormSchema.safeParse(snapshot).success) {
      await form.trigger();
      if (sessionOperation.current !== operation) return;
      focusFirstFormError(form, productDraftFieldOrder);
      releaseSave(generation);
      endLockedTransition();
      return;
    }
    try {
      setFormAlert(null);
      if (storyEditor?.dirty && !(await storyEditor.save())) {
        if (sessionOperation.current === operation) {
          setFormAlert(
            'История создания не сохранена. Исправьте ошибки и повторите отправку.',
          );
        }
        return;
      }
      if (sessionOperation.current !== operation) return;
      await submit.mutateAsync({
        id,
        currentValues: snapshot,
        authEpoch: authEpochAtSubmit,
        generation,
      });
      if (
        sessionOperation.current === operation &&
        saveGeneration.current === generation
      ) {
        setFormAlert(null);
      }
    } catch (error) {
      if (
        sessionOperation.current === operation &&
        saveGeneration.current === generation
      ) {
        reportFailure(
          error,
          'Не удалось сохранить и отправить предмет на модерацию.',
        );
      }
    } finally {
      if (sessionOperation.current === operation) {
        releaseSave(generation);
        endLockedTransition();
      }
    }
  };

  return {
    transitionLock,
    inputsLocked,
    formAlert,
    save,
    submit,
    persistCurrentForm,
    persistAll,
    persistForTransitionRef,
    submitCurrentForm,
    endLockedTransition,
    snapshotOperation: () => sessionOperation.current,
    isCurrentOperation: (operation: number) =>
      sessionOperation.current === operation,
    inFlightSave: () => pendingSave.current,
    saveInFlight: () => saveInFlight.current,
    persistedProductId: () => persistedProductId.current,
  };
}

export type ProductDraftSaveSession = ReturnType<
  typeof useProductDraftSaveSession
>;
