import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation, useRouter } from 'expo-router';
import { usePreventRemove } from 'expo-router/build/react-navigation/core';
import type { UseFormReturn } from 'react-hook-form';

import type { Product } from '@bidplace/contracts';

import {
  canOpenProductWizardStep,
  createProductWizardDraft,
  createProductWizardHref,
  parseProductWizardStepParam,
  productWizardStep,
  resolveProductWizardStep,
  shouldRewriteProductWizardStepParam,
  type ProductWizardDraft,
  type ProductWizardStepParam,
} from './product-draft-wizard';
import {
  productDraftRequiredErrors,
  type ProductDraftFormValues,
} from './product-draft-form';
import type { ProductDraftSaveSession } from './product-draft-save';
import type { ProductStoryEditor } from './use-product-story-editor';

/**
 * Exit and step navigation for the product draft screen: delayed navigation
 * after a successful persist, the route-removal guard, wizard step param
 * rewriting, and the About / close save actions.
 */
export function useProductDraftNavigation({
  productId,
  stepParam,
  isCreationFlow,
  existingProduct,
  productDetailLoading,
  form,
  storyEditor,
  session,
  retireGuard,
}: {
  productId?: string;
  stepParam?: ProductWizardStepParam;
  isCreationFlow: boolean;
  existingProduct?: Product;
  productDetailLoading: boolean;
  form: UseFormReturn<ProductDraftFormValues>;
  storyEditor: ProductStoryEditor;
  session: ProductDraftSaveSession;
  // Retire the browser sentinel before a saved step change replaces the URL:
  // the guard's own cleanup bails once the URL moved, which would leak the
  // sentinel into history.
  retireGuard: () => Promise<void>;
}) {
  const router = useRouter();
  const navigation = useNavigation();
  const wizardDraft: ProductWizardDraft = createProductWizardDraft(
    existingProduct ?? null,
  );
  const requestedStep = parseProductWizardStepParam(stepParam);
  const wizardStep = resolveProductWizardStep(requestedStep, wizardDraft);
  const pendingNavigation = useRef<(() => void) | null>(null);
  const [pendingNavigationVersion, setPendingNavigationVersion] = useState(0);
  const [stepOneAttempted, setStepOneAttempted] = useState(false);

  useEffect(() => {
    if (form.formState.isDirty || storyEditor.dirty || storyEditor.pending)
      return;
    const navigate = pendingNavigation.current;
    if (!navigate || session.inputsLocked) return;
    pendingNavigation.current = null;
    navigate();
  }, [
    form.formState.isDirty,
    storyEditor.dirty,
    storyEditor.pending,
    session.inputsLocked,
    pendingNavigationVersion,
  ]);

  const navigateAfterPersist = useCallback((navigate: () => void) => {
    pendingNavigation.current = navigate;
    setPendingNavigationVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    if (!productId || !isCreationFlow || productDetailLoading) return;
    if (!existingProduct) return;
    const resolvedStep = resolveProductWizardStep(requestedStep, wizardDraft);
    if (!shouldRewriteProductWizardStepParam(stepParam, resolvedStep)) return;
    router.setParams({ flow: 'creation', step: String(resolvedStep) });
  }, [
    existingProduct,
    isCreationFlow,
    productDetailLoading,
    productId,
    requestedStep,
    router,
    stepParam,
    wizardDraft.hasProduct,
    wizardDraft.imageCount,
  ]);

  usePreventRemove(
    form.formState.isDirty ||
      storyEditor.dirty ||
      storyEditor.pending ||
      session.inputsLocked,
    ({ data }) => {
      const operation = session.snapshotOperation();
      void session.persistAll('transition').then((persisted) => {
        if (!session.isCurrentOperation(operation) || !persisted) return;
        navigateAfterPersist(() => navigation.dispatch(data.action));
        session.endLockedTransition();
      });
    },
  );

  const moveToWizardStep = async (nextStep: number) => {
    if (session.transitionLock.current || storyEditor.pending) return;
    if (!existingProduct) return;
    if (!canOpenProductWizardStep(nextStep, wizardDraft)) return;
    if (nextStep === wizardStep) return;
    const operation = session.snapshotOperation();
    if (form.formState.isDirty || storyEditor.dirty) {
      // Save failure оставляет автора на текущем шаге (02 §9): переход только
      // после успешной записи dirty values.
      if (!(await session.persistAll('transition'))) return;
    }
    if (!session.isCurrentOperation(operation)) return;
    await retireGuard();
    router.setParams({ flow: 'creation', step: String(nextStep) });
    session.endLockedTransition();
  };

  const saveAbout = async () => {
    if (session.transitionLock.current) return;
    setStepOneAttempted(true);
    const snapshot = form.getValues();
    const requiredErrors = productDraftRequiredErrors(snapshot);
    if (
      isCreationFlow &&
      Object.values(requiredErrors).some((error) => error !== undefined)
    ) {
      return;
    }
    const operation = session.snapshotOperation();
    if (
      !(await session.persistCurrentForm(
        isCreationFlow ? 'transition' : 'ordinary',
      ))
    )
      return;
    if (!session.isCurrentOperation(operation)) return;
    if (!isCreationFlow) return;
    const persistedId = session.persistedProductId();
    if (!persistedId) {
      session.endLockedTransition();
      return;
    }
    if (!existingProduct) {
      navigateAfterPersist(() =>
        router.replace(
          createProductWizardHref(persistedId, productWizardStep.images),
        ),
      );
      session.endLockedTransition();
      return;
    }
    await retireGuard();
    router.setParams({
      flow: 'creation',
      step: String(productWizardStep.images),
    });
    session.endLockedTransition();
  };

  const saveAndClose = async () => {
    if (
      session.transitionLock.current ||
      session.saveInFlight() ||
      storyEditor.pending
    )
      return;
    const operation = session.snapshotOperation();
    if (form.formState.isDirty || storyEditor.dirty) {
      if (!(await session.persistAll('transition'))) return;
      if (!session.isCurrentOperation(operation)) return;
      navigateAfterPersist(() => router.replace('/profile'));
      session.endLockedTransition();
      return;
    }
    router.replace('/profile');
  };

  const saveStoryAndContinue = async () => {
    if (session.transitionLock.current || storyEditor.pending) return;
    const operation = session.snapshotOperation();
    const persisted = await session.persistAll('transition');
    if (!persisted) return;
    if (!session.isCurrentOperation(operation)) return;
    await retireGuard();
    if (isCreationFlow)
      router.setParams({
        flow: 'creation',
        step: String(productWizardStep.review),
      });
    session.endLockedTransition();
  };

  return {
    wizardDraft,
    wizardStep,
    stepOneAttempted,
    moveToWizardStep,
    saveAbout,
    saveAndClose,
    saveStoryAndContinue,
  };
}
