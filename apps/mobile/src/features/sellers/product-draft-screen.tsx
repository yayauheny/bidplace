import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { FormPageShell, WizardProgress } from '../../components/layout';
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
import {
  canOpenProductWizardStep,
  createProductWizardDraft,
  createProductWizardHref,
  parseProductWizardStepParam,
  productWizardStep,
  productWizardStepCount,
  productWizardStepTitles,
  resolveProductWizardStep,
  shouldRewriteProductWizardStepParam,
  type ProductWizardStepParam,
} from './product-draft-wizard';
import { ProductDraftAboutStep } from './product-draft-about';
import { ProductDraftImagesStep } from './product-draft-images';
import { ProductDraftReviewStep } from './product-draft-review';
import { ProductDraftStoryStep } from './product-draft-story';
import {
  canOwnerEditProduct,
  ownerModerationReasonNotice,
  ownerProductSubmitLabel,
} from './product-draft-state';

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
  const [imageSelectionError, setImageSelectionError] = useState<string | null>(
    null,
  );
  const [stepOneAttempted, setStepOneAttempted] = useState(false);
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
  }, [existingProduct, initializedProductId]);

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
          createProductWizardHref(product.id, productWizardStep.photos),
        );
        return;
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

  if (categories.isLoading || (productId && productDetail.isLoading))
    return (
      <FormPageShell>
        <PageState title="Загружаем предмет…" loading />
      </FormPageShell>
    );
  if (
    categories.isError ||
    !categories.data ||
    (productId && (!productDetail.data || !existingProduct))
  )
    return (
      <FormPageShell>
        <AppText role="sectionTitle">Не удалось загрузить предмет</AppText>
        <SecondaryButton
          label="Повторить"
          onPress={() => {
            void categories.refetch();
            void productDetail.refetch();
          }}
        />
      </FormPageShell>
    );

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
  const parsedYear = year.trim() ? Number(year) : null;
  const stepOneErrors = {
    categoryId: categoryId ? undefined : 'Выберите категорию',
    title: title.trim() ? undefined : 'Введите название',
    year:
      parsedYear === null ||
      (Number.isInteger(parsedYear) && parsedYear >= 0 && parsedYear <= 9999)
        ? undefined
        : 'Введите год числом от 0 до 9999',
    uniqueness: uniqueness.trim()
      ? undefined
      : 'Укажите уникальность или тираж',
  };
  const canSaveTitle = !stepOneErrors.title;
  const canSaveDetails =
    !stepOneErrors.categoryId &&
    !stepOneErrors.year &&
    !stepOneErrors.uniqueness;
  const canSaveCurrentSection =
    !isCreationFlow || wizardStep === productWizardStep.photos
      ? canSaveTitle
      : wizardStep === productWizardStep.details
        ? canSaveDetails
        : true;
  const moveToWizardStep = (step: number) => {
    if (!existingProduct) return;
    if (!canOpenProductWizardStep(step, wizardDraft)) return;
    if (step === wizardStep) return;
    setStepOneAttempted(false);
    router.setParams({ flow: 'creation', step: String(step) });
  };

  return (
    <FormPageShell>
      {isCreationFlow ? (
        <WizardProgress
          step={wizardStep}
          total={productWizardStepCount}
          title={
            wizardSubmitted
              ? 'Предмет отправлен'
              : productWizardStepTitles[wizardStep]
          }
          description={
            wizardSubmitted
              ? 'Черновик отправлен на модерацию.'
              : wizardStep === productWizardStep.photos
                ? 'Добавьте фотографии и название. Статус продажи и цена скрыты в v1.'
                : wizardStep === productWizardStep.details
                  ? 'Категория, размеры, материал, техника, тираж и год.'
                  : wizardStep === productWizardStep.story
                    ? 'Необязательно. Можно пропустить.'
                    : 'Проверьте работу и отправьте на модерацию.'
          }
          onBack={
            wizardStep > productWizardStep.photos
              ? () => moveToWizardStep(wizardStep - 1)
              : () => router.push('/profile')
          }
          onClose={() => router.push('/profile')}
        />
      ) : null}
      {!isCreationFlow ? (
        <View style={{ gap: designTokens.space.x2 }}>
          <AppText role="screenTitle">
            {existingProduct ? 'Редактировать предмет' : 'Новый предмет'}
          </AppText>
          <AppText role="bodySmall" tone="secondary">
            Черновик можно сохранить неполным. Для модерации нужны обязательные
            поля и хотя бы одно изображение.
          </AppText>
        </View>
      ) : null}

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

      {!isCreationFlow ||
      wizardStep === productWizardStep.photos ||
      wizardStep === productWizardStep.details ? (
        <ProductDraftAboutStep
          isCreationFlow={isCreationFlow}
          wizardStep={wizardStep}
          section={
            isCreationFlow
              ? wizardStep === productWizardStep.photos
                ? 'title'
                : 'details'
              : 'all'
          }
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
          uniqueness={uniqueness}
          onChangeUniqueness={setUniqueness}
          condition={condition}
          provenance={provenance}
          onChangeProvenance={setProvenance}
          stepOneAttempted={stepOneAttempted}
          stepOneErrors={stepOneErrors}
          canSaveCurrentSection={canSaveCurrentSection}
          saveIsPending={save.isPending}
          saveIsError={save.isError}
          onSavePress={() => {
            if (isCreationFlow) {
              setStepOneAttempted(true);
              if (!canSaveCurrentSection) return;
            }
            save.mutate();
          }}
          wizardCanContinue={
            wizardStep === productWizardStep.photos
              ? canOpenProductWizardStep(productWizardStep.details, wizardDraft)
              : canOpenProductWizardStep(productWizardStep.story, wizardDraft) &&
                canSaveDetails
          }
          continueLabel={
            wizardStep === productWizardStep.photos
              ? 'Продолжить к деталям'
              : 'Продолжить к истории'
          }
          onContinue={() =>
            moveToWizardStep(
              wizardStep === productWizardStep.photos
                ? productWizardStep.details
                : productWizardStep.story,
            )
          }
        />
      ) : null}

      {existingProduct &&
      (!isCreationFlow || wizardStep === productWizardStep.photos) ? (
        <ProductDraftImagesStep
          images={existingProduct.images}
          productStatus={productStatus}
          editable={editable}
          isCreationFlow={isCreationFlow}
          wizardStep={wizardStep}
          wizardCanOpenCreation={canOpenProductWizardStep(
            productWizardStep.story,
            wizardDraft,
          )}
          embedded={isCreationFlow}
          reorderPending={reorderImages.isPending}
          removePending={removeImage.isPending}
          uploadPending={upload.isPending}
          uploadError={upload.isError}
          imageSelectionError={imageSelectionError}
          removeOrReorderError={removeImage.isError || reorderImages.isError}
          onChooseImages={() => void chooseImages()}
          onMoveImage={reorder}
          onDeleteImage={(imageId) => setImagePendingDelete(imageId)}
          onBackToAbout={() => moveToWizardStep(productWizardStep.photos)}
          onContinueToCreation={() =>
            moveToWizardStep(productWizardStep.story)
          }
        />
      ) : null}

      {isCreationFlow &&
      wizardStep === productWizardStep.story &&
      existingProduct ? (
        <ProductDraftStoryStep
          editable={editable}
          story={story}
          onChangeStory={setStory}
          savePending={save.isPending}
          saveError={save.isError}
          onSaveAndContinue={() => {
            save.mutate(undefined, {
              onSuccess: () => moveToWizardStep(productWizardStep.review),
            });
          }}
          onBack={() => moveToWizardStep(productWizardStep.details)}
          onSkip={() => moveToWizardStep(productWizardStep.review)}
        />
      ) : null}

      {isCreationFlow &&
      wizardStep === productWizardStep.review &&
      existingProduct ? (
        <ProductDraftReviewStep
          editable={editable}
          existingProductTitle={existingProduct.title}
          existingProductImagesLength={existingProduct.images.length}
          story={story}
          categoryName={
            categories.data.categories.find((item) => item.id === categoryId)
              ?.name
          }
          submitLabel={submitLabel}
          wizardSubmitted={wizardSubmitted}
          submitPending={submit.isPending}
          onSubmitPress={() => submit.mutate(existingProduct.id)}
          onBackToStory={() => moveToWizardStep(productWizardStep.story)}
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

 
