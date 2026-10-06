import { useCallback, useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useNavigation, useRouter } from 'expo-router';
import { usePreventRemove } from 'expo-router/build/react-navigation/core';
import { View } from 'react-native';

import type {
  Product,
  ProductStatus,
  SellerProductDetailResponse,
} from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import { AppShell, FormPageShell } from '../../components/layout';
import { MediaDeliveryNotice } from '../../components/shared/MediaDeliveryNotice';
import { InfrastructurePageStatus } from '../../components/shared/InfrastructurePageStatus';
import {
  combineInfrastructurePageStatus,
  infrastructurePageFetchStatus,
} from '../../components/shared/infrastructure-page-status';
import {
  AppDialog,
  AppText,
  DestructiveButton,
  FormSection,
  PageState,
  PrimaryButton,
  SecondaryButton,
} from '../../components/ui';
import {
  applyFormFailure,
  focusFirstFormError,
  getUserFacingErrorMessage,
  isNotFoundError,
  readFormFailure,
} from '../../errors';
import { presentEnum, productStatusLabels } from '../../lib/presentation';
import { useApiClient } from '../../providers/api-provider';
import {
  canWritePrivateCache,
  categoryKeys,
  currentAuthEpoch,
} from '../../lib/query-cache';
import { usePrivateCacheEpoch } from '../../lib/use-private-cache-epoch';
import { persistedFieldOverrides } from './reconcile-saved-fields';
import { invalidateOwnerWorks, ownerWorkQueryKeys } from './owner-work-query';
import { ProductDraftAboutStep } from './product-draft-about';
import { ProductDraftWriteGuard } from './product-draft-fields';
import {
  emptyProductDraftFormValues,
  productDraftFormSchema,
  productDraftRequiredErrors,
  productDraftToWriteRequest,
  productToDraftFormValues,
  shouldHydrateProductDraft,
  type ProductDraftFormValues,
} from './product-draft-form';
import { ProductDraftImagesStep } from './product-draft-images';
import { ProductDraftReviewStep } from './product-draft-review';
import {
  canOwnerEditProduct,
  isNewerModerationDecision,
  nextPostSubmitHold,
  ownerModerationReasonNotice,
  ownerProductSubmitLabel,
  shouldKeepCachedProductRevision,
  type ProductRevisionIdentity,
} from './product-draft-state';
import { ProductDraftStoryStep } from './product-draft-story';
import {
  canOpenProductWizardStep,
  createProductWizardDraft,
  createProductWizardHref,
  parseProductWizardStepParam,
  productWizardStep,
  resolveProductWizardStep,
  shouldRewriteProductWizardStepParam,
  type ProductWizardStepParam,
} from './product-draft-wizard';

const productDraftHistoryGuardKey = '__bidplaceProductDraftGuard';

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

type TrustedRevision = ProductRevisionIdentity & { status: ProductStatus };

export function ProductDraftScreen({
  productId,
  flow,
  stepParam,
}: {
  productId?: string;
  flow?: string;
  stepParam?: ProductWizardStepParam;
}) {
  const api = useApiClient();
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const authEpoch = usePrivateCacheEpoch(queryClient);
  const seenAuthEpoch = useRef(authEpoch);
  const form = useForm<ProductDraftFormValues>({
    defaultValues: emptyProductDraftFormValues,
    resolver: zodResolver(productDraftFormSchema),
    mode: 'onChange',
    shouldUnregister: false,
  });
  const [formAlert, setFormAlert] = useState<string | null>(null);
  const productFieldOrder = [
    'categoryId',
    'title',
    'technique',
    'materials',
    'dimensions',
    'year',
    'uniqueness',
    'story',
  ] as const;
  const draftTitle = useWatch({ control: form.control, name: 'title' });
  const hydratedProductId = useRef<string | null>(null);
  const hydratedUpdatedAt = useRef<string | null>(null);
  const persistedProductId = useRef<string | null>(productId ?? null);
  const transitionLock = useRef(false);
  const saveInFlight = useRef(false);
  const pendingSave = useRef<Promise<boolean> | null>(null);
  const deleteConfirmLock = useRef(false);
  const saveGeneration = useRef(0);
  const imageSelection = useRef(0);
  const sessionOperation = useRef(0);
  const resetSaveMutation = useRef<() => void>(() => undefined);
  const detailReads = useRef(0);
  const ignoreDetailReadsBefore = useRef(0);
  const holdFloor = useRef<ProductRevisionIdentity | null>(null);
  const onTrustedDetail = useRef<(revision: TrustedRevision) => void>(
    () => undefined,
  );
  const [inputsLocked, setInputsLocked] = useState(false);
  const pendingNavigation = useRef<(() => void) | null>(null);
  const persistCurrentFormRef = useRef<() => Promise<boolean>>(
    async () => false,
  );
  const browserNavigation = useRef<{
    id: string;
    restoring: boolean;
    allow: boolean;
  } | null>(null);
  const [pendingNavigationVersion, setPendingNavigationVersion] = useState(0);
  const [deleteConfirmLocked, setDeleteConfirmLocked] = useState(false);
  const [imagePendingDelete, setImagePendingDelete] = useState<string | null>(
    null,
  );
  const pendingUpload = useRef<{ images: Blob[]; key: string } | null>(null);
  const [imageSelectionError, setImageSelectionError] = useState<string | null>(
    null,
  );
  const [stepOneAttempted, setStepOneAttempted] = useState(false);
  const [wizardSubmitted, setWizardSubmitted] = useState(false);
  const [moderationHold, setModerationHold] = useState(false);
  const [submittedRevision, setSubmittedRevision] =
    useState<ProductRevisionIdentity | null>(null);
  const [trustedRevision, setTrustedRevision] =
    useState<TrustedRevision | null>(null);
  onTrustedDetail.current = (revision) => {
    setTrustedRevision((current) => {
      if (
        current &&
        current.id === revision.id &&
        current.version === revision.version &&
        current.status === revision.status &&
        current.updatedAt === revision.updatedAt
      ) {
        return current;
      }
      return revision;
    });
  };

  const categories = useQuery({
    queryKey: categoryKeys.all,
    queryFn: ({ signal }) => api.categories.list({ signal }),
  });
  const productDetail = useQuery({
    queryKey: productId
      ? ownerWorkQueryKeys.detail(productId)
      : ownerWorkQueryKeys.detailRoot,
    queryFn: async ({ signal }) => {
      detailReads.current += 1;
      const readId = detailReads.current;
      const epoch = currentAuthEpoch(queryClient);
      const result = await api.sellers.getProduct(productId!);
      const current = queryClient.getQueryData<SellerProductDetailResponse>(
        ownerWorkQueryKeys.detail(productId!),
      );
      const staleRead =
        signal.aborted || readId <= ignoreDetailReadsBefore.current;
      if (!canWritePrivateCache(queryClient, epoch) || staleRead) {
        if (current) return current;
        throw new Error('Private cache is closed');
      }
      const committed =
        current && shouldKeepCachedProductRevision(current, result)
          ? current
          : result;
      if (ignoreDetailReadsBefore.current > 0 && committed.editingRevision) {
        onTrustedDetail.current(committed.editingRevision);
      }
      return committed;
    },
    enabled: Boolean(productId),
  });
  const existingProduct = productDetail.data?.product;
  const persistedRevisionUpdatedAt =
    productDetail.data?.editingRevision?.updatedAt;
  const editingRevisionStatus = productDetail.data?.editingRevision?.status;
  const productStatus = existingProduct?.status;
  const editorStatus =
    productStatus === 'APPROVED' || productStatus === 'ARCHIVED'
      ? editingRevisionStatus
      : productStatus;
  const isCreationFlow = flow === 'creation' || !productId;
  const wizardDraft = createProductWizardDraft(existingProduct ?? null);
  const requestedStep = parseProductWizardStepParam(stepParam);
  const wizardStep = resolveProductWizardStep(requestedStep, wizardDraft);

  useEffect(() => {
    if (!productId || !isCreationFlow || productDetail.isLoading) return;
    if (!existingProduct) return;
    const resolvedStep = resolveProductWizardStep(requestedStep, wizardDraft);
    if (!shouldRewriteProductWizardStepParam(stepParam, resolvedStep)) return;
    router.setParams({ flow: 'creation', step: String(resolvedStep) });
  }, [
    existingProduct,
    isCreationFlow,
    productDetail.isLoading,
    productId,
    requestedStep,
    router,
    stepParam,
    wizardDraft.hasProduct,
    wizardDraft.imageCount,
  ]);

  useEffect(() => {
    if (!existingProduct) return;
    if (
      !shouldHydrateProductDraft({
        hydratedProductId: hydratedProductId.current,
        hydratedUpdatedAt: hydratedUpdatedAt.current,
        nextProductId: existingProduct.id,
        nextUpdatedAt: persistedRevisionUpdatedAt ?? existingProduct.updatedAt,
        isDirty: form.formState.isDirty,
      })
    ) {
      return;
    }
    form.reset(productToDraftFormValues(existingProduct));
    hydratedProductId.current = existingProduct.id;
    hydratedUpdatedAt.current =
      persistedRevisionUpdatedAt ?? existingProduct.updatedAt;
  }, [
    existingProduct,
    form,
    form.formState.isDirty,
    persistedRevisionUpdatedAt,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!form.formState.isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [form.formState.isDirty]);

  useEffect(() => {
    if (form.formState.isDirty || inputsLocked || !pendingNavigation.current)
      return;
    const navigate = pendingNavigation.current;
    pendingNavigation.current = null;
    navigate();
  }, [form.formState.isDirty, inputsLocked, pendingNavigationVersion]);

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
    pendingUpload.current = null;
    saveGeneration.current += 1;
    imageSelection.current += 1;
    detailReads.current += 1;
    ignoreDetailReadsBefore.current = detailReads.current;
    holdFloor.current = null;
    saveInFlight.current = false;
    resetSaveMutation.current();
    setFormAlert(null);
    endLockedTransition();
    setModerationHold(false);
    setSubmittedRevision(null);
    setTrustedRevision(null);
    setWizardSubmitted(false);
    hydratedProductId.current = null;
    hydratedUpdatedAt.current = null;
  }, [authEpoch]);

  const rememberSavedProduct = (
    product: Product,
    submitted: ProductDraftFormValues,
  ) => {
    persistedProductId.current = product.id;
    const cached = queryClient.getQueryData<SellerProductDetailResponse>(
      ownerWorkQueryKeys.detail(product.id),
    );
    hydratedProductId.current = product.id;
    hydratedUpdatedAt.current =
      cached?.editingRevision?.updatedAt ??
      cached?.product.updatedAt ??
      product.updatedAt;
    const persisted = productToDraftFormValues(product);
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

  const retireBrowserGuard = async () => {
    const guard = browserNavigation.current;
    if (
      !guard ||
      guard.allow ||
      typeof window === 'undefined' ||
      window.history.state?.[productDraftHistoryGuardKey] !== guard.id
    )
      return;
    guard.allow = true;
    await new Promise<void>((resolve) => {
      window.addEventListener('popstate', () => resolve(), { once: true });
      window.history.back();
    });
  };

  const save = useMutation({
    mutationFn: ({ values }: ProductSaveRequest) => {
      const id = persistedProductId.current;
      const body = productDraftToWriteRequest(values);
      return id ? api.products.update(id, body) : api.products.create(body);
    },
    onSuccess: async ({ product }, request) => {
      if (request.generation !== saveGeneration.current) return;
      if (!canWritePrivateCache(queryClient, request.authEpoch)) return;
      await retireBrowserGuard();
      if (request.generation !== saveGeneration.current) return;
      if (!canWritePrivateCache(queryClient, request.authEpoch)) return;
      rememberSavedProduct(product, request.values);
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
      await retireBrowserGuard();
      if (request.generation !== saveGeneration.current) return;
      if (!canWritePrivateCache(queryClient, request.authEpoch)) return;
      rememberSavedProduct(result.product, request.currentValues);
      ignoreDetailReadsBefore.current = detailReads.current;
      setModerationHold(true);
      setTrustedRevision(null);
      setWizardSubmitted(true);
      await queryClient.cancelQueries({
        queryKey: ownerWorkQueryKeys.detail(result.product.id),
      });
      if (request.generation !== saveGeneration.current) return;
      if (!canWritePrivateCache(queryClient, request.authEpoch)) return;
      const settled = queryClient.getQueryData<SellerProductDetailResponse>(
        ownerWorkQueryKeys.detail(result.product.id),
      );
      const settledRevision = settled?.editingRevision;
      holdFloor.current = settledRevision
        ? {
            id: settledRevision.id,
            version: settledRevision.version,
            updatedAt: settledRevision.updatedAt,
          }
        : null;
      setSubmittedRevision(holdFloor.current);
      try {
        await invalidateSavedProduct(result.product.id);
      } catch {
        return;
      }
    },
  });
  const upload = useMutation({
    mutationFn: async (images: Blob[]) => {
      const epoch = currentAuthEpoch(queryClient);
      const id = persistedProductId.current;
      if (!id) throw new Error('Product is not saved');
      const key = pendingUpload.current?.key;
      await api.images.add(id, images, key);
      return epoch;
    },
    onSuccess: (epoch) => {
      if (!canWritePrivateCache(queryClient, epoch)) return;
      pendingUpload.current = null;
      const id = persistedProductId.current;
      if (!id) return;
      return invalidateOwnerWorks(queryClient, id);
    },
  });
  const removeImage = useMutation({
    mutationFn: async (imageId: string) => {
      const epoch = currentAuthEpoch(queryClient);
      const id = persistedProductId.current;
      if (!id) throw new Error('Product is not saved');
      await api.images.remove(id, imageId);
      return epoch;
    },
    onSuccess: (epoch) => {
      if (!canWritePrivateCache(queryClient, epoch)) return;
      const id = persistedProductId.current;
      if (!id) return;
      return invalidateOwnerWorks(queryClient, id);
    },
  });
  const reorderImages = useMutation({
    mutationFn: async (imageIds: string[]) => {
      const epoch = currentAuthEpoch(queryClient);
      const id = persistedProductId.current;
      if (!id) throw new Error('Product is not saved');
      await api.images.reorder(id, imageIds);
      return epoch;
    },
    onSuccess: (epoch) => {
      if (!canWritePrivateCache(queryClient, epoch)) return;
      const id = persistedProductId.current;
      if (!id) return;
      return invalidateOwnerWorks(queryClient, id);
    },
  });

  const releaseSave = (generation: number) => {
    if (saveGeneration.current === generation) saveInFlight.current = false;
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
              focusFirstFormError(form, productFieldOrder);
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
            const failure = readFormFailure(error, productFieldOrder);
            if (failure.disposition === 'passthrough') {
              setFormAlert(getUserFacingErrorMessage(error, 'Не удалось сохранить предмет'));
            } else {
              applyFormFailure(form, failure, productFieldOrder);
              setFormAlert(failure.formMessage);
            }
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
  persistCurrentFormRef.current = () => persistCurrentForm('transition');

  const navigateAfterPersist = useCallback((navigate: () => void) => {
    pendingNavigation.current = navigate;
    setPendingNavigationVersion((version) => version + 1);
  }, []);

  usePreventRemove(form.formState.isDirty || inputsLocked, ({ data }) => {
    const operation = sessionOperation.current;
    void persistCurrentForm('transition').then((persisted) => {
      if (sessionOperation.current !== operation || !persisted) return;
      navigateAfterPersist(() => navigation.dispatch(data.action));
      endLockedTransition();
    });
  });
  useEffect(() => {
    if (typeof window === 'undefined' || !form.formState.isDirty) return;

    const guard = {
      id: `${productId ?? 'new'}:${Date.now()}`,
      restoring: false,
      allow: false,
    };
    browserNavigation.current = guard;
    window.history.pushState(
      {
        ...(window.history.state ?? {}),
        [productDraftHistoryGuardKey]: guard.id,
      },
      '',
      window.location.href,
    );

    const persistAndContinueBrowserBack = () => {
      guard.allow = true;
      const operation = sessionOperation.current;
      void persistCurrentFormRef.current().then((persisted) => {
        if (sessionOperation.current !== operation || !persisted) {
          guard.allow = false;
          return;
        }
        endLockedTransition();
        window.history.go(-2);
      });
    };
    const onPopState = (event: PopStateEvent) => {
      if (event.state?.[productDraftHistoryGuardKey] === guard.id) {
        if (guard.restoring) {
          guard.restoring = false;
          persistAndContinueBrowserBack();
        }
        return;
      }
      if (guard.allow) {
        guard.allow = false;
        return;
      }
      guard.restoring = true;
      window.history.go(1);
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      if (browserNavigation.current === guard) {
        browserNavigation.current = null;
      }
    };
  }, [form.formState.isDirty, productId]);

  useEffect(() => {
    if (!moderationHold || !trustedRevision) return;
    const decision = nextPostSubmitHold(holdFloor.current, trustedRevision);
    if (decision.open) {
      holdFloor.current = null;
      setModerationHold(false);
      setSubmittedRevision(null);
      setTrustedRevision(null);
      setWizardSubmitted(false);
      return;
    }
    holdFloor.current = decision.floor;
    setSubmittedRevision((current) =>
      current &&
      current.id === decision.floor.id &&
      current.version === decision.floor.version &&
      current.updatedAt === decision.floor.updatedAt
        ? current
        : decision.floor,
    );
  }, [moderationHold, trustedRevision]);

  useEffect(() => {
    if (!moderationHold || !submittedRevision) return;
    const incoming = productDetail.data?.editingRevision;
    if (!incoming || !isNewerModerationDecision(submittedRevision, incoming))
      return;
    holdFloor.current = null;
    setModerationHold(false);
    setSubmittedRevision(null);
    setTrustedRevision(null);
    setWizardSubmitted(false);
  }, [moderationHold, productDetail.data?.editingRevision, submittedRevision]);

  const moveToWizardStep = async (nextStep: number) => {
    if (transitionLock.current) return;
    if (!existingProduct) return;
    if (!canOpenProductWizardStep(nextStep, wizardDraft)) return;
    if (nextStep === wizardStep) return;
    const operation = sessionOperation.current;
    if (form.formState.isDirty && !(await persistCurrentForm('transition')))
      return;
    if (sessionOperation.current !== operation) return;
    router.setParams({ flow: 'creation', step: String(nextStep) });
    endLockedTransition();
  };

  const saveAbout = async () => {
    if (transitionLock.current) return;
    setStepOneAttempted(true);
    const snapshot = form.getValues();
    const requiredErrors = productDraftRequiredErrors(snapshot);
    if (
      isCreationFlow &&
      Object.values(requiredErrors).some((error) => error !== undefined)
    ) {
      return;
    }
    const operation = sessionOperation.current;
    if (!(await persistCurrentForm(isCreationFlow ? 'transition' : 'ordinary')))
      return;
    if (sessionOperation.current !== operation) return;
    if (!isCreationFlow) return;
    const persistedId = persistedProductId.current;
    if (!persistedId) {
      endLockedTransition();
      return;
    }
    if (!existingProduct) {
      navigateAfterPersist(() =>
        router.replace(
          createProductWizardHref(persistedId, productWizardStep.images),
        ),
      );
      endLockedTransition();
      return;
    }
    router.setParams({
      flow: 'creation',
      step: String(productWizardStep.images),
    });
    endLockedTransition();
  };

  const saveAndClose = async () => {
    if (transitionLock.current) return;
    const operation = sessionOperation.current;
    if (form.formState.isDirty) {
      if (!(await persistCurrentForm('transition'))) return;
      if (sessionOperation.current !== operation) return;
      navigateAfterPersist(() => router.replace('/profile'));
      endLockedTransition();
      return;
    }
    router.replace('/profile');
  };

  const submitCurrentForm = async () => {
    if (saveInFlight.current || !beginLockedTransition()) return;
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
      focusFirstFormError(form, productFieldOrder);
      releaseSave(generation);
      endLockedTransition();
      return;
    }
    try {
      setFormAlert(null);
      await submit.mutateAsync({
        id,
        currentValues: snapshot,
        authEpoch: authEpochAtSubmit,
        generation,
      });
      if (sessionOperation.current === operation && saveGeneration.current === generation) {
        setFormAlert(null);
      }
    } catch (error) {
      if (sessionOperation.current === operation && saveGeneration.current === generation) {
        const failure = readFormFailure(error, productFieldOrder);
        if (failure.disposition === 'passthrough') {
          setFormAlert(getUserFacingErrorMessage(error, 'Не удалось сохранить и отправить предмет на модерацию.'));
        } else {
          applyFormFailure(form, failure, productFieldOrder);
          setFormAlert(failure.formMessage);
        }
      }
    } finally {
      if (sessionOperation.current === operation) {
        releaseSave(generation);
        endLockedTransition();
      }
    }
  };

  const chooseImages = async () => {
    if (transitionLock.current || !existingProduct) return;
    const epoch = currentAuthEpoch(queryClient);
    const operation = sessionOperation.current;
    const selection = imageSelection.current + 1;
    imageSelection.current = selection;
    const stillOwnsImages = () =>
      selection === imageSelection.current &&
      !transitionLock.current &&
      sessionOperation.current === operation &&
      canWritePrivateCache(queryClient, epoch);
    if (editorStatus === 'APPROVED') {
      const inFlight = pendingSave.current;
      const persisted = inFlight
        ? await inFlight
        : await persistCurrentForm('ordinary');
      if (!persisted) return;
    }
    if (!stillOwnsImages()) return;
    setImageSelectionError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 1,
      });
      if (!stillOwnsImages()) return;
      if (result.canceled) return;
      const images = await Promise.all(
        result.assets.map(async (asset) => {
          const response = await fetch(asset.uri);
          if (!response.ok) throw new Error('Selected image could not be read');
          return response.blob();
        }),
      );
      if (!stillOwnsImages()) return;
      pendingUpload.current = { images, key: crypto.randomUUID() };
      upload.mutate(images);
    } catch {
      if (!stillOwnsImages()) return;
      setImageSelectionError(
        'Не удалось прочитать выбранные изображения. Выберите файлы ещё раз.',
      );
    }
  };

  const categoriesStatus = infrastructurePageFetchStatus(categories);
  const productFetchStatus = productId
    ? infrastructurePageFetchStatus(productDetail)
    : 'ready';
  const pageStatus = combineInfrastructurePageStatus(
    productId ? [categoriesStatus, productFetchStatus] : [categoriesStatus],
  );
  const retryDraftPage = () => {
    void categories.refetch();
    void productDetail.refetch();
  };

  if (
    productId &&
    isNotFoundError(productDetail.error) &&
    pageStatus !== 'loading'
  ) {
    return (
      <FormPageShell hideDock>
        <PageState title="Предмет не найден" />
      </FormPageShell>
    );
  }

  if (
    pageStatus !== 'ready' ||
    !categories.data ||
    (productId &&
      (productDetail.isError || !productDetail.data || !existingProduct))
  ) {
    return (
      <AppShell>
        <InfrastructurePageStatus
          status={pageStatus === 'loading' ? 'loading' : 'error'}
          onRetry={retryDraftPage}
        />
      </AppShell>
    );
  }

  const moderationReopened = Boolean(
    submittedRevision &&
    productDetail.data?.editingRevision &&
    isNewerModerationDecision(
      submittedRevision,
      productDetail.data.editingRevision,
    ),
  );
  const editable =
    canOwnerEditProduct(existingProduct?.status, editingRevisionStatus) &&
    (!moderationHold || moderationReopened);
  const moderationNotice = ownerModerationReasonNotice(
    editorStatus,
    productDetail.data?.lastModerationReason,
  );
  const submitLabel = ownerProductSubmitLabel(editorStatus);
  const reorder = async (imageId: string, direction: -1 | 1) => {
    if (!existingProduct) return;
    const operation = sessionOperation.current;
    const epoch = currentAuthEpoch(queryClient);
    if (editorStatus === 'APPROVED') {
      const inFlight = pendingSave.current;
      const persisted = inFlight ? await inFlight : await persistCurrentForm();
      if (!persisted) return;
    }
    if (
      sessionOperation.current !== operation ||
      !canWritePrivateCache(queryClient, epoch)
    )
      return;
    const ids = existingProduct.images.map((image) => image.id);
    const index = ids.indexOf(imageId);
    [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
    reorderImages.mutate(ids);
  };

  return (
    <FormProvider {...form}>
      <ProductDraftWriteGuard guard={transitionLock}>
        <FormPageShell hideDock>
          {isCreationFlow ? (
            <FormSection
              title={
                wizardSubmitted ? 'Предмет отправлен' : 'Создание предмета'
              }
              description={
                wizardSubmitted
                  ? 'Черновик отправлен на модерацию. Дальше команда проверит его содержание и изображения.'
                  : 'Заполните предмет по шагам, сохраните промежуточные изменения и проверьте публикацию перед отправкой.'
              }
            >
              <View
                accessibilityRole="tablist"
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: designTokens.space.x2,
                }}
              >
                {[
                  'О работе',
                  'Изображения',
                  'История создания',
                  'Проверка',
                ].map((label, index) => {
                  const currentStep = index + 1;
                  return (
                    <SecondaryButton
                      key={label}
                      label={`${currentStep}. ${label}`}
                      disabled={
                        wizardSubmitted ||
                        !canOpenProductWizardStep(currentStep, wizardDraft)
                      }
                      onPress={() => void moveToWizardStep(currentStep)}
                    />
                  );
                })}
              </View>
              {existingProduct ? (
                <AppText role="metadata" tone="secondary">
                  Шаг {wizardStep} из 4 · {draftTitle.trim() || 'Без названия'}
                </AppText>
              ) : null}
              <SecondaryButton
                label={
                  form.formState.isDirty ? 'Сохранить и закрыть' : 'Закрыть'
                }
                loading={save.isPending}
                disabled={submit.isPending || inputsLocked}
                onPress={() => void saveAndClose()}
              />
            </FormSection>
          ) : null}

          <View style={{ gap: designTokens.space.x2 }}>
            <AppText role="screenTitle">
              {existingProduct ? 'Редактировать предмет' : 'Новый предмет'}
            </AppText>
            <AppText role="bodySmall" tone="secondary">
              Черновик можно сохранить неполным. Для модерации нужны название,
              категория и хотя бы одно изображение.
            </AppText>
          </View>

          <MediaDeliveryNotice delivery={productDetail.data?.publication} />
          {moderationNotice ? (
            <FormSection title={moderationNotice.title}>
              <AppText role="bodySmall" tone="danger">
                {moderationNotice.body}
              </AppText>
            </FormSection>
          ) : null}

          {existingProduct && !isCreationFlow ? (
            <FormSection title="Статус предмета">
              <AppText
                role="bodySmall"
                tone={
                  editorStatus === 'APPROVED'
                    ? 'success'
                    : editorStatus === 'CHANGES_REQUESTED' ||
                        editorStatus === 'REJECTED'
                      ? 'danger'
                      : 'secondary'
                }
              >
                {editorStatus
                  ? presentEnum(
                      editorStatus,
                      productStatusLabels,
                      'Неизвестный статус предмета',
                    )
                  : null}
              </AppText>
              <SecondaryButton
                label="Обновить"
                onPress={() => void productDetail.refetch()}
              />
              {editable ? (
                <PrimaryButton
                  label={submitLabel}
                  loading={submit.isPending}
                  disabled={
                    existingProduct.images.length < 1 ||
                    save.isPending ||
                    inputsLocked
                  }
                  onPress={() => void submitCurrentForm()}
                />
              ) : null}
              {submit.isError ? (
                <AppText role="bodySmall" tone="danger">
                  Не удалось сохранить и отправить предмет на модерацию.
                </AppText>
              ) : null}
            </FormSection>
          ) : null}

          {existingProduct && !editable && !isCreationFlow ? (
            <AppText role="bodySmall" tone="danger">
              Предмет уже нельзя редактировать или изменять его изображения.
            </AppText>
          ) : null}

          {!isCreationFlow || wizardStep === productWizardStep.about ? (
            <ProductDraftAboutStep
              isCreationFlow={isCreationFlow}
              wizardStep={wizardStep}
              editable={editable && !inputsLocked}
              categories={categories.data.categories}
              stepOneAttempted={stepOneAttempted}
              saveIsPending={save.isPending}
              saveIsError={save.isError && !formAlert}
              saveMessage={formAlert}
              onSavePress={() => void saveAbout()}
              wizardCanOpenImages={canOpenProductWizardStep(
                productWizardStep.images,
                wizardDraft,
              )}
              onContinueToImages={() =>
                void moveToWizardStep(productWizardStep.images)
              }
            />
          ) : null}

          {existingProduct &&
          (!isCreationFlow || wizardStep === productWizardStep.images) ? (
            <ProductDraftImagesStep
              images={existingProduct.images}
              productStatus={editorStatus}
              editable={editable && !inputsLocked}
              isCreationFlow={isCreationFlow}
              wizardStep={wizardStep}
              wizardCanOpenStory={canOpenProductWizardStep(
                productWizardStep.story,
                wizardDraft,
              )}
              reorderPending={reorderImages.isPending}
              removePending={removeImage.isPending}
              uploadPending={upload.isPending}
              uploadError={upload.isError}
              uploadMessage={
                upload.error
                  ? readFormFailure(upload.error, []).formMessage ??
                    getUserFacingErrorMessage(upload.error, 'Не удалось загрузить изображения.')
                  : null
              }
              imageSelectionError={imageSelectionError}
              removeOrReorderError={
                removeImage.isError || reorderImages.isError
              }
              onRetryUpload={() => {
                if (
                  pendingUpload.current &&
                  !upload.isPending &&
                  !transitionLock.current
                )
                  upload.mutate(pendingUpload.current.images);
              }}
              onChooseImages={() => void chooseImages()}
              onMoveImage={reorder}
              onDeleteImage={(imageId) => setImagePendingDelete(imageId)}
              onBackToAbout={() =>
                void moveToWizardStep(productWizardStep.about)
              }
              onContinueToStory={() =>
                void moveToWizardStep(productWizardStep.story)
              }
            />
          ) : null}

          {isCreationFlow &&
          wizardStep === productWizardStep.story &&
          existingProduct ? (
            <ProductDraftStoryStep
              editable={editable && !inputsLocked}
              savePending={save.isPending}
              saveError={save.isError}
              onBackToImages={() =>
                void moveToWizardStep(productWizardStep.images)
              }
              onSaveAndContinue={() =>
                void (async () => {
                  if (transitionLock.current) return;
                  const operation = sessionOperation.current;
                  if (
                    form.formState.isDirty &&
                    !(await persistCurrentForm('transition'))
                  ) {
                    return;
                  }
                  if (sessionOperation.current !== operation) return;
                  router.setParams({
                    flow: 'creation',
                    step: String(productWizardStep.review),
                  });
                  endLockedTransition();
                })()
              }
            />
          ) : null}

          {isCreationFlow &&
          wizardStep === productWizardStep.review &&
          existingProduct ? (
            <ProductDraftReviewStep
              editable={editable && !inputsLocked}
              existingProductImagesLength={existingProduct.images.length}
              submitLabel={submitLabel}
              wizardSubmitted={wizardSubmitted}
              submitPending={submit.isPending || save.isPending}
              submitError={submit.isError}
              onSubmitPress={() => void submitCurrentForm()}
              onBackToStory={() =>
                void moveToWizardStep(productWizardStep.story)
              }
            />
          ) : null}

          <AppDialog
            open={imagePendingDelete !== null}
            title="Удалить изображение?"
            description="Изображение будет удалено из предмета. Это действие нельзя отменить."
            onClose={() => setImagePendingDelete(null)}
          >
            <DestructiveButton
              label="Удалить изображение"
              loading={deleteConfirmLocked || removeImage.isPending}
              onPress={() => {
                if (!imagePendingDelete || deleteConfirmLock.current) return;
                const imageId = imagePendingDelete;
                deleteConfirmLock.current = true;
                setDeleteConfirmLocked(true);
                void (async () => {
                  try {
                    const operation = sessionOperation.current;
                    const epoch = currentAuthEpoch(queryClient);
                    if (editorStatus === 'APPROVED') {
                      const inFlight = pendingSave.current;
                      const persisted = inFlight
                        ? await inFlight
                        : await persistCurrentForm();
                      if (!persisted) return;
                    }
                    if (
                      sessionOperation.current !== operation ||
                      !canWritePrivateCache(queryClient, epoch)
                    ) {
                      return;
                    }
                    await removeImage.mutateAsync(imageId);
                    setImagePendingDelete(null);
                  } catch {
                    // The dialog stays open so the same confirm can be repeated.
                  } finally {
                    deleteConfirmLock.current = false;
                    setDeleteConfirmLocked(false);
                  }
                })();
              }}
            />
            <SecondaryButton
              label="Отмена"
              disabled={deleteConfirmLocked || removeImage.isPending}
              onPress={() => setImagePendingDelete(null)}
            />
          </AppDialog>
        </FormPageShell>
      </ProductDraftWriteGuard>
    </FormProvider>
  );
}
