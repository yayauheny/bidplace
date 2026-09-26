import { useCallback, useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useForm, type FieldPath, type FieldPathValue } from 'react-hook-form';
import { useNavigation, useRouter } from 'expo-router';
import { usePreventRemove } from 'expo-router/build/react-navigation/core';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell, FormPageShell } from '../../components/layout';
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
import { isNotFoundError } from '../../errors';
import { presentEnum, productStatusLabels } from '../../lib/presentation';
import { useApiClient } from '../../providers/api-provider';
import { categoryKeys } from '../../lib/query-cache';
import { ProductDraftAboutStep } from './product-draft-about';
import {
  emptyProductDraftFormValues,
  persistProductDraftBeforeSubmit,
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
  ownerModerationReasonNotice,
  ownerProductSubmitLabel,
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
  const form = useForm<ProductDraftFormValues>({
    defaultValues: emptyProductDraftFormValues,
    resolver: zodResolver(productDraftFormSchema),
    mode: 'onChange',
  });
  const values = form.watch();
  const hydratedProductId = useRef<string | null>(null);
  const hydratedUpdatedAt = useRef<string | null>(null);
  const pendingNavigation = useRef<(() => void) | null>(null);
  const persistCurrentFormRef = useRef<() => Promise<boolean>>(async () => false);
  const browserNavigation = useRef<{
    id: string;
    restoring: boolean;
    allow: boolean;
  } | null>(null);
  const [pendingNavigationVersion, setPendingNavigationVersion] = useState(0);
  const [imagePendingDelete, setImagePendingDelete] = useState<string | null>(
    null,
  );
  const [imageSelectionError, setImageSelectionError] = useState<string | null>(
    null,
  );
  const [stepOneAttempted, setStepOneAttempted] = useState(false);
  const [wizardSubmitted, setWizardSubmitted] = useState(false);

  const categories = useQuery({
    queryKey: categoryKeys.all,
    queryFn: () => api.categories.list(),
  });
  const productDetail = useQuery({
    queryKey: ['seller', 'product', productId],
    queryFn: () => api.sellers.getProduct(productId!),
    enabled: Boolean(productId),
  });
  const existingProduct = productDetail.data?.product;
  const persistedRevisionUpdatedAt =
    productDetail.data?.editingRevision?.updatedAt;
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
    if (form.formState.isDirty || !pendingNavigation.current) return;
    const navigate = pendingNavigation.current;
    pendingNavigation.current = null;
    navigate();
  }, [form.formState.isDirty, pendingNavigationVersion]);

  const save = useMutation({
    mutationFn: (currentValues: ProductDraftFormValues) =>
      existingProduct
        ? api.products.update(
            existingProduct.id,
            productDraftToWriteRequest(currentValues),
          )
        : api.products.create(productDraftToWriteRequest(currentValues)),
    onSuccess: ({ product }) => {
      form.reset(productToDraftFormValues(product));
      hydratedProductId.current = product.id;
      hydratedUpdatedAt.current = product.updatedAt;
      void queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
      void queryClient.invalidateQueries({
        queryKey: ['seller', 'product', product.id],
      });
    },
  });
  const submit = useMutation({
    mutationFn: ({
      id,
      currentValues,
    }: {
      id: string;
      currentValues: ProductDraftFormValues;
    }) =>
      persistProductDraftBeforeSubmit(
        () =>
          api.products.update(id, productDraftToWriteRequest(currentValues)),
        () => api.products.submit(id),
      ),
    onSuccess: async ({ product }) => {
      form.reset(productToDraftFormValues(product));
      hydratedProductId.current = product.id;
      hydratedUpdatedAt.current = product.updatedAt;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['seller', 'products'] }),
        queryClient.invalidateQueries({
          queryKey: ['seller', 'product', product.id],
        }),
      ]);
      setWizardSubmitted(true);
    },
  });
  const upload = useMutation({
    mutationFn: (images: Blob[]) => api.images.add(existingProduct!.id, images),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['seller', 'product', existingProduct?.id],
      }),
  });
  const removeImage = useMutation({
    mutationFn: (imageId: string) =>
      api.images.remove(existingProduct!.id, imageId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['seller', 'product', existingProduct?.id],
      }),
  });
  const reorderImages = useMutation({
    mutationFn: (imageIds: string[]) =>
      api.images.reorder(existingProduct!.id, imageIds),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['seller', 'product', existingProduct?.id],
      }),
  });

  const setField = <K extends FieldPath<ProductDraftFormValues>>(
    field: K,
    value: FieldPathValue<ProductDraftFormValues, K>,
  ) => {
    form.setValue(field, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const persistCurrentForm = useCallback(async () => {
    const valid = await form.trigger();
    if (!valid) return false;
    try {
      await save.mutateAsync(form.getValues());
      return true;
    } catch {
      return false;
    }
  }, [form, save]);
  persistCurrentFormRef.current = persistCurrentForm;

  const navigateAfterPersist = useCallback((navigate: () => void) => {
    pendingNavigation.current = navigate;
    setPendingNavigationVersion((version) => version + 1);
  }, []);

  usePreventRemove(form.formState.isDirty, ({ data }) => {
    void persistCurrentForm().then((persisted) => {
      if (persisted) {
        navigateAfterPersist(() => navigation.dispatch(data.action));
      }
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
      { ...(window.history.state ?? {}), [productDraftHistoryGuardKey]: guard.id },
      '',
      window.location.href,
    );

    const persistAndContinueBrowserBack = () => {
      void persistCurrentFormRef.current().then((persisted) => {
        if (!persisted) return;
        guard.allow = true;
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
      if (
        !guard.allow &&
        window.history.state?.[productDraftHistoryGuardKey] === guard.id
      ) {
        window.history.back();
      }
    };
  }, [form.formState.isDirty, productId]);

  const moveToWizardStep = async (nextStep: number) => {
    if (!existingProduct) return;
    if (!canOpenProductWizardStep(nextStep, wizardDraft)) return;
    if (nextStep === wizardStep) return;
    if (form.formState.isDirty && !(await persistCurrentForm())) return;
    router.setParams({ flow: 'creation', step: String(nextStep) });
  };

  const saveAbout = async () => {
    setStepOneAttempted(true);
    const requiredErrors = productDraftRequiredErrors(form.getValues());
    if (
      isCreationFlow &&
      Object.values(requiredErrors).some((error) => error !== undefined)
    ) {
      return;
    }
    if (!(await persistCurrentForm())) return;
    const persistedId = existingProduct?.id ?? hydratedProductId.current;
    if (!isCreationFlow || !persistedId) return;
    if (!existingProduct) {
      navigateAfterPersist(() =>
        router.replace(
          createProductWizardHref(persistedId, productWizardStep.images),
        ),
      );
      return;
    }
    router.setParams({
      flow: 'creation',
      step: String(productWizardStep.images),
    });
  };

  const saveAndClose = async () => {
    if (form.formState.isDirty) {
      if (!(await persistCurrentForm())) return;
      navigateAfterPersist(() => router.replace('/profile'));
      return;
    }
    router.replace('/profile');
  };

  const submitCurrentForm = async () => {
    if (!existingProduct) return;
    const valid = await form.trigger();
    if (!valid) return;
    submit.mutate({
      id: existingProduct.id,
      currentValues: form.getValues(),
    });
  };

  const chooseImages = async () => {
    if (!existingProduct) return;
    if (editorStatus === 'APPROVED' && !(await persistCurrentForm())) return;
    setImageSelectionError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 1,
      });
      if (result.canceled) return;
      const images = await Promise.all(
        result.assets.map(async (asset) => {
          const response = await fetch(asset.uri);
          if (!response.ok) throw new Error('Selected image could not be read');
          return response.blob();
        }),
      );
      upload.mutate(images);
    } catch {
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

  const editingRevisionStatus = productDetail.data?.editingRevision?.status;
  const editable = canOwnerEditProduct(
    existingProduct?.status,
    editingRevisionStatus,
  );
  const productStatus = existingProduct?.status;
  const editorStatus =
    productStatus === 'APPROVED' || productStatus === 'ARCHIVED'
      ? editingRevisionStatus
      : productStatus;
  const moderationNotice = ownerModerationReasonNotice(
    editorStatus,
    productDetail.data?.lastModerationReason,
  );
  const submitLabel = ownerProductSubmitLabel(editorStatus);
  const requiredErrors = productDraftRequiredErrors(values);
  const yearError = form.formState.errors.year?.message;
  const stepOneErrors = { ...requiredErrors, year: yearError };
  const canSaveStepOne =
    Object.values(requiredErrors).every((error) => error === undefined) &&
    !yearError;

  const reorder = async (imageId: string, direction: -1 | 1) => {
    if (!existingProduct) return;
    if (editorStatus === 'APPROVED' && !(await persistCurrentForm())) return;
    const ids = existingProduct.images.map((image) => image.id);
    const index = ids.indexOf(imageId);
    [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
    reorderImages.mutate(ids);
  };

  return (
    <FormPageShell hideDock>
      {isCreationFlow ? (
        <FormSection
          title={wizardSubmitted ? 'Предмет отправлен' : 'Создание предмета'}
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
            {['О работе', 'Изображения', 'История создания', 'Проверка'].map(
              (label, index) => {
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
              },
            )}
          </View>
          {existingProduct ? (
            <AppText role="metadata" tone="secondary">
              Шаг {wizardStep} из 4 · {values.title.trim() || 'Без названия'}
            </AppText>
          ) : null}
          <SecondaryButton
            label={form.formState.isDirty ? 'Сохранить и закрыть' : 'Закрыть'}
            loading={save.isPending}
            disabled={submit.isPending}
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
              disabled={existingProduct.images.length < 1 || save.isPending}
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
          editable={editable}
          categories={categories.data.categories}
          categoryId={values.categoryId}
          onChangeCategoryId={(value) => setField('categoryId', value)}
          technique={values.technique}
          onChangeTechnique={(value) => setField('technique', value)}
          materials={values.materials}
          onChangeMaterials={(value) => setField('materials', value)}
          dimensions={values.dimensions}
          onChangeDimensions={(value) => setField('dimensions', value)}
          year={values.year}
          onChangeYear={(value) => setField('year', value)}
          title={values.title}
          onChangeTitle={(value) => setField('title', value)}
          uniqueness={values.uniqueness}
          onChangeUniqueness={(value) => setField('uniqueness', value)}
          stepOneAttempted={stepOneAttempted}
          stepOneErrors={stepOneErrors}
          canSaveStepOne={canSaveStepOne}
          saveIsPending={save.isPending}
          saveIsError={save.isError}
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
          editable={editable}
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
          imageSelectionError={imageSelectionError}
          removeOrReorderError={removeImage.isError || reorderImages.isError}
          onChooseImages={() => void chooseImages()}
          onMoveImage={reorder}
          onDeleteImage={(imageId) => setImagePendingDelete(imageId)}
          onBackToAbout={() => void moveToWizardStep(productWizardStep.about)}
          onContinueToStory={() =>
            void moveToWizardStep(productWizardStep.story)
          }
        />
      ) : null}

      {isCreationFlow &&
      wizardStep === productWizardStep.story &&
      existingProduct ? (
        <ProductDraftStoryStep
          editable={editable}
          story={values.story}
          onChangeStory={(value) => setField('story', value)}
          savePending={save.isPending}
          saveError={save.isError}
          onBackToImages={() => void moveToWizardStep(productWizardStep.images)}
          onSaveAndContinue={() =>
            void (async () => {
              if (form.formState.isDirty && !(await persistCurrentForm())) {
                return;
              }
              router.setParams({
                flow: 'creation',
                step: String(productWizardStep.review),
              });
            })()
          }
        />
      ) : null}

      {isCreationFlow &&
      wizardStep === productWizardStep.review &&
      existingProduct ? (
        <ProductDraftReviewStep
          editable={editable}
          title={values.title}
          existingProductImagesLength={existingProduct.images.length}
          hasStory={Boolean(values.story.trim())}
          submitLabel={submitLabel}
          wizardSubmitted={wizardSubmitted}
          submitPending={submit.isPending || save.isPending}
          submitError={submit.isError}
          onSubmitPress={() => void submitCurrentForm()}
          onBackToStory={() => void moveToWizardStep(productWizardStep.story)}
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
          loading={removeImage.isPending}
          onPress={() => {
            if (imagePendingDelete) {
              void (async () => {
                if (
                  editorStatus === 'APPROVED' &&
                  !(await persistCurrentForm())
                ) {
                  return;
                }
                removeImage.mutate(imagePendingDelete, {
                  onSuccess: () => setImagePendingDelete(null),
                });
              })();
            }
          }}
        />
        <SecondaryButton
          label="Отмена"
          disabled={removeImage.isPending}
          onPress={() => setImagePendingDelete(null)}
        />
      </AppDialog>
    </FormPageShell>
  );
}
