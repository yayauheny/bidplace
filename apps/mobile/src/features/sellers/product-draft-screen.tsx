import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
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
import { presentEnum, productStatusLabels } from '../../lib/presentation';
import { useApiClient } from '../../providers/api-provider';
import { isNotFoundError } from '../../errors';
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
import { ProductDraftAboutStep } from './product-draft-about';
import { ProductDraftCreationStep } from './product-draft-creation';
import { ProductDraftImagesStep } from './product-draft-images';
import { ProductDraftReviewStep } from './product-draft-review';
import {
  canOwnerEditProduct,
  ownerModerationReasonNotice,
  ownerProductSubmitLabel,
} from './product-draft-state';

type DraftCreationStep = {
  id?: string;
  title: string;
  body: string;
  imageUrl?: string | null;
};

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
  const queryClient = useQueryClient();
  const categories = useQuery({
    queryKey: ['products', 'categories'],
    queryFn: () => api.categories.list(),
  });
  const productDetail = useQuery({
    queryKey: ['seller', 'product', productId],
    queryFn: () => api.sellers.getProduct(productId!),
    enabled: Boolean(productId),
  });
  const existingProduct = productDetail.data?.product;
  const [initializedProductId, setInitializedProductId] = useState<
    string | null
  >(null);
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [technique, setTechnique] = useState('');
  const [materials, setMaterials] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [weight, setWeight] = useState('');
  const [year, setYear] = useState('');
  const [condition, setCondition] = useState('');
  const [uniqueness, setUniqueness] = useState('');
  const [provenance, setProvenance] = useState('');
  const [city, setCity] = useState('');
  const [packaging, setPackaging] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState('');
  const [imagePendingDelete, setImagePendingDelete] = useState<string | null>(
    null,
  );
  const [creationIntro, setCreationIntro] = useState('');
  const [creationSteps, setCreationSteps] = useState<DraftCreationStep[]>([]);
  const [creationStorySaved, setCreationStorySaved] = useState(true);
  const [imageSelectionError, setImageSelectionError] = useState<string | null>(
    null,
  );
  const [creationImageSelectionError, setCreationImageSelectionError] =
    useState<string | null>(null);
  const [stepOneAttempted, setStepOneAttempted] = useState(false);
  const [creationAttempted, setCreationAttempted] = useState(false);
  const [wizardSubmitted, setWizardSubmitted] = useState(false);
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
    productId,
    isCreationFlow,
    productDetail.isLoading,
    existingProduct,
    requestedStep,
    stepParam,
    wizardDraft.hasProduct,
    wizardDraft.imageCount,
    router,
  ]);

  useEffect(() => {
    if (!existingProduct || initializedProductId === existingProduct.id) return;
    setInitializedProductId(existingProduct.id);
    setCategoryId(existingProduct.categoryId ?? '');
    setTitle(existingProduct.title ?? '');
    setStory(existingProduct.story ?? '');
    setTechnique(existingProduct.technique ?? '');
    setMaterials(existingProduct.materials ?? '');
    setDimensions(existingProduct.dimensions ?? '');
    setWeight(existingProduct.weight ?? '');
    setYear(existingProduct.year?.toString() ?? '');
    setCondition(existingProduct.condition ?? '');
    setUniqueness(existingProduct.uniqueness ?? '');
    setProvenance(existingProduct.provenance ?? '');
    setCity(existingProduct.city ?? '');
    setPackaging(existingProduct.packaging ?? '');
    setDeliveryInfo(existingProduct.deliveryInfo ?? '');
    setCreationIntro(productDetail.data?.creationIntro ?? '');
    const persistedSteps = productDetail.data?.creationSteps ?? [];
    setCreationSteps(
      persistedSteps.length > 0
        ? persistedSteps.map((step) => ({
            id: step.id,
            title: step.title,
            body: step.body,
            imageUrl: step.image?.url ?? null,
          }))
        : [],
    );
    setCreationStorySaved(true);
  }, [existingProduct, initializedProductId, productDetail.data]);

  const input = () => ({
    categoryId: categoryId || undefined,
    title: title || undefined,
    story: story || undefined,
    technique: technique || null,
    materials: materials || null,
    dimensions: dimensions || null,
    weight: weight || null,
    year: parsedYear,
    condition: condition || undefined,
    uniqueness: uniqueness || undefined,
    provenance: provenance || undefined,
    city: city || undefined,
    packaging: packaging || undefined,
    deliveryInfo: deliveryInfo || undefined,
  });
  const save = useMutation({
    mutationFn: () =>
      existingProduct
        ? api.products.update(existingProduct.id, input())
        : api.products.create(input()),
    onSuccess: ({ product }) => {
      const productQueryId = existingProduct?.id ?? product.id;
      void queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
      void queryClient.invalidateQueries({
        queryKey: ['seller', 'product', productQueryId],
      });
      if (!existingProduct) {
        router.replace(
          createProductWizardHref(product.id, productWizardStep.images),
        );
        return;
      }
      if (isCreationFlow) {
        router.setParams({
          flow: 'creation',
          step: String(productWizardStep.images),
        });
      }
    },
  });
  const submit = useMutation({
    mutationFn: (id: string) => api.products.submit(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['seller', 'products'] }),
        queryClient.invalidateQueries({
          queryKey: ['seller', 'product', existingProduct?.id],
        }),
      ]);
      setWizardSubmitted(true);
    },
  });
  const replaceCreation = useMutation({
    mutationFn: () =>
      api.products.replaceCreation(existingProduct!.id, {
        intro: creationIntro.trim() || null,
        steps: creationSteps.map((step) => ({
          ...(step.id ? { id: step.id } : {}),
          title: step.title.trim(),
          body: step.body.trim(),
        })),
      }),
    onSuccess: ({ creation }) => {
      setCreationSteps(
        creation.steps.map((step) => ({
          id: step.id,
          title: step.title,
          body: step.body,
          imageUrl: step.image?.url ?? null,
        })),
      );
      setCreationAttempted(false);
      setCreationStorySaved(true);
    },
  });
  const uploadCreationStepImage = useMutation({
    mutationFn: ({ stepId, image }: { stepId: string; image: Blob }) =>
      api.images.addCreationStepImage(existingProduct!.id, stepId, image),
    onSuccess: (_result, variables) => {
      setCreationImageSelectionError(null);
      setCreationSteps((current) =>
        current.map((step) =>
          step.id === variables.stepId
            ? {
                ...step,
                imageUrl: `/api/creation-steps/${variables.stepId}/image`,
              }
            : step,
        ),
      );
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
  const chooseImages = async () => {
    if (!existingProduct) return;
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

  if (productId && isNotFoundError(productDetail.error) && pageStatus !== 'loading') {
    return (
      <FormPageShell hideDock>
        <PageState title="Предмет не найден" />
      </FormPageShell>
    );
  }

  if (
    pageStatus !== 'ready' ||
    !categories.data ||
    (productId && (productDetail.isError || !productDetail.data || !existingProduct))
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

  const editable = canOwnerEditProduct(existingProduct?.status);
  const productStatus = existingProduct?.status;
  const moderationNotice = ownerModerationReasonNotice(
    productStatus,
    productDetail.data?.lastModerationReason,
  );
  const submitLabel = ownerProductSubmitLabel(productStatus);
  const reorder = (imageId: string, direction: -1 | 1) => {
    if (!existingProduct) return;
    const ids = existingProduct.images.map((image) => image.id);
    const index = ids.indexOf(imageId);
    [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
    reorderImages.mutate(ids);
  };
  const updateCreationStep = (
    index: number,
    field: keyof DraftCreationStep,
    value: string,
  ) => {
    setCreationStorySaved(false);
    setCreationSteps((current) =>
      current.map((step, stepIndex) =>
        stepIndex === index ? { ...step, [field]: value } : step,
      ),
    );
  };
  const parsedYear = year.trim() ? Number(year) : null;
  const stepOneErrors = {
    categoryId: categoryId ? undefined : 'Выберите категорию',
    title: title.trim() ? undefined : 'Введите название',
    story: story.trim() ? undefined : 'Добавьте описание работы',
    year:
      parsedYear === null ||
      (Number.isInteger(parsedYear) && parsedYear >= 0 && parsedYear <= 9999)
        ? undefined
        : 'Введите год числом от 0 до 9999',
    uniqueness: uniqueness.trim()
      ? undefined
      : 'Укажите уникальность или тираж',
    provenance: provenance.trim() ? undefined : 'Укажите происхождение',
    city: city.trim() ? undefined : 'Укажите город',
    deliveryInfo: deliveryInfo.trim()
      ? undefined
      : 'Опишите передачу или доставку',
  };
  const canSaveStepOne = Object.values(stepOneErrors).every(
    (error) => error === undefined,
  );
  const canSaveCreation = creationSteps.every(
    (step) => step.title.trim().length > 0 && step.body.trim().length > 0,
  );
  const moveToWizardStep = (step: number) => {
    if (!existingProduct) return;
    if (!canOpenProductWizardStep(step, wizardDraft)) return;
    if (step === wizardStep) return;
    router.setParams({ flow: 'creation', step: String(step) });
  };
  const chooseCreationStepImage = async (stepId: string) => {
    setCreationImageSelectionError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 1,
      });
      if (result.canceled || !result.assets[0]) return;
      const response = await fetch(result.assets[0].uri);
      if (!response.ok)
        throw new Error('Selected process image could not be read');
      const image = await response.blob();
      uploadCreationStepImage.mutate({ stepId, image });
    } catch {
      setCreationImageSelectionError(
        'Не удалось прочитать фотографию этапа. Выберите файл ещё раз.',
      );
    }
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
                const step = index + 1;
                return (
                  <SecondaryButton
                    key={label}
                    label={`${step}. ${label}`}
                    disabled={
                      wizardSubmitted ||
                      !canOpenProductWizardStep(step, wizardDraft)
                    }
                    onPress={() => moveToWizardStep(step)}
                  />
                );
              },
            )}
          </View>
          {existingProduct ? (
            <AppText role="metadata" tone="secondary">
              Шаг {wizardStep} из 4 ·{' '}
              {existingProduct.title ?? 'Без названия'}
            </AppText>
          ) : null}
        </FormSection>
      ) : null}
      <View style={{ gap: designTokens.space.x2 }}>
        <AppText role="screenTitle">
          {existingProduct ? 'Редактировать предмет' : 'Новый предмет'}
        </AppText>
        <AppText role="bodySmall" tone="secondary">
          Черновик можно сохранить неполным. Для модерации нужны обязательные
          поля и хотя бы одно изображение.
        </AppText>
        <AppText role="bodySmall" tone="secondary">
          Автором предмета публично будет указан ваш профиль продавца.
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
              productStatus === 'APPROVED'
                ? 'success'
                : productStatus === 'CHANGES_REQUESTED' ||
                    productStatus === 'REJECTED'
                  ? 'danger'
                  : 'secondary'
            }
          >
            {productStatus
              ? presentEnum(
                  productStatus,
                  productStatusLabels,
                  'Неизвестный статус предмета',
                )
              : null}
          </AppText>
          <SecondaryButton
            label="Обновить"
            onPress={() => void productDetail.refetch()}
          />
          {productStatus !== 'APPROVED' && editable ? (
            <PrimaryButton
              label={submitLabel}
              loading={submit.isPending}
              disabled={existingProduct.images.length < 1}
              onPress={() => submit.mutate(existingProduct.id)}
            />
          ) : null}
          {productStatus !== 'APPROVED' && existingProduct.images.length < 1 ? (
            <AppText role="bodySmall" tone="danger">
              Добавьте хотя бы одно изображение перед отправкой.
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
          categoryId={categoryId}
          onChangeCategoryId={setCategoryId}
          technique={technique}
          onChangeTechnique={setTechnique}
          materials={materials}
          onChangeMaterials={setMaterials}
          dimensions={dimensions}
          onChangeDimensions={setDimensions}
          weight={weight}
          onChangeWeight={setWeight}
          year={year}
          onChangeYear={setYear}
          city={city}
          onChangeCity={setCity}
          packaging={packaging}
          onChangePackaging={setPackaging}
          deliveryInfo={deliveryInfo}
          onChangeDeliveryInfo={setDeliveryInfo}
          title={title}
          onChangeTitle={setTitle}
          story={story}
          onChangeStory={setStory}
          uniqueness={uniqueness}
          onChangeUniqueness={setUniqueness}
          condition={condition}
          provenance={provenance}
          onChangeProvenance={setProvenance}
          stepOneAttempted={stepOneAttempted}
          stepOneErrors={stepOneErrors}
          canSaveStepOne={canSaveStepOne}
          saveIsPending={save.isPending}
          saveIsError={save.isError}
          onSavePress={() => {
            if (isCreationFlow) {
              setStepOneAttempted(true);
              if (!canSaveStepOne) return;
            }
            save.mutate();
          }}
          wizardCanOpenImages={canOpenProductWizardStep(
            productWizardStep.images,
            wizardDraft,
          )}
          onContinueToImages={() =>
            moveToWizardStep(productWizardStep.images)
          }
        />
      ) : null}

      {existingProduct && (!isCreationFlow || wizardStep === productWizardStep.images) ? (
        <ProductDraftImagesStep
          images={existingProduct.images}
          productStatus={productStatus}
          editable={editable}
          isCreationFlow={isCreationFlow}
          wizardStep={wizardStep}
          wizardCanOpenCreation={canOpenProductWizardStep(
            productWizardStep.creation,
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
          onBackToAbout={() => moveToWizardStep(productWizardStep.about)}
          onContinueToCreation={() =>
            moveToWizardStep(productWizardStep.creation)
          }
        />
      ) : null}

      {isCreationFlow &&
      wizardStep === productWizardStep.creation &&
      existingProduct ? (
        <ProductDraftCreationStep
          editable={editable}
          creationIntro={creationIntro}
          onChangeCreationIntro={(value) => {
            setCreationIntro(value);
            setCreationStorySaved(false);
          }}
          creationSteps={creationSteps}
          creationAttempted={creationAttempted}
          updateCreationStep={updateCreationStep}
          onDeleteCreationStep={(index) => {
            setCreationStorySaved(false);
            setCreationSteps((current) =>
              current.filter((_item, stepIndex) => stepIndex !== index),
            );
          }}
          onAddCreationStep={() => {
            setCreationStorySaved(false);
            setCreationSteps((current) => [...current, { title: '', body: '' }]);
          }}
          replaceCreationPending={replaceCreation.isPending}
          replaceCreationError={replaceCreation.isError}
          creationStorySaved={creationStorySaved}
          onSaveCreationPress={() => {
            setCreationAttempted(true);
            if (!canSaveCreation) return;
            replaceCreation.mutate();
          }}
          uploadCreationStepImagePending={uploadCreationStepImage.isPending}
          uploadCreationStepImageError={uploadCreationStepImage.isError}
          creationImageSelectionError={creationImageSelectionError}
          onChooseCreationStepImage={(stepId) => {
            void chooseCreationStepImage(stepId);
          }}
          onBackToImages={() => moveToWizardStep(productWizardStep.images)}
          onContinueToReview={() =>
            moveToWizardStep(productWizardStep.review)
          }
        />
      ) : null}

      {isCreationFlow &&
      wizardStep === productWizardStep.review &&
      existingProduct ? (
        <ProductDraftReviewStep
          editable={editable}
          existingProductTitle={existingProduct.title}
          existingProductImagesLength={existingProduct.images.length}
          creationSteps={creationSteps}
          submitLabel={submitLabel}
          wizardSubmitted={wizardSubmitted}
          submitPending={submit.isPending}
          onSubmitPress={() => submit.mutate(existingProduct.id)}
          onBackToCreation={() =>
            moveToWizardStep(productWizardStep.creation)
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
          loading={removeImage.isPending}
          onPress={() => {
            if (imagePendingDelete)
              removeImage.mutate(imagePendingDelete, {
                onSuccess: () => setImagePendingDelete(null),
              });
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

 
