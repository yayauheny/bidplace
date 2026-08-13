import { useEffect, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import {
  FormPageColumns,
  FormPageShell,
} from '../../components/layout/FormPageShell';
import {
  AppDialog,
  AppText,
  DestructiveButton,
  FormSection,
  PageState,
  PrimaryButton,
  ResilientRemoteImage,
  SecondaryButton,
  TextButton,
  TextField,
} from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';
import { presentEnum, productStatusLabels } from '../../lib/presentation';
import { useApiClient } from '../../providers/api-provider';

function DraftImageRow({
  url,
  position,
  editable,
  isLast,
  isReordering,
  isRemoving,
  onMove,
  onDelete,
}: {
  url: string;
  position: number;
  editable: boolean;
  isLast: boolean;
  isReordering: boolean;
  isRemoving: boolean;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
}) {
  const mediaStyle = {
    width: 160,
    height: 200,
    borderRadius: designTokens.radius.image,
    backgroundColor: designTokens.color.placeholder,
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: designTokens.space.x3,
      }}
    >
      <ResilientRemoteImage
        uri={getApiAssetUrl(url)}
        component="ProductGallery"
        accessibilityLabel={`Изображение предмета ${position + 1}`}
        fallbackLabel={`Изображение ${position + 1} недоступно`}
        style={mediaStyle}
        contentFit="contain"
      />
      {editable ? (
        <View style={{ flex: 1, minWidth: 0, gap: designTokens.space.x1 }}>
          <TextButton
            label="Переместить выше"
            disabled={position === 0 || isReordering}
            onPress={() => onMove(-1)}
          />
          <TextButton
            label="Переместить ниже"
            disabled={isLast || isReordering}
            onPress={() => onMove(1)}
          />
          <TextButton
            label="Удалить изображение"
            disabled={isRemoving}
            onPress={onDelete}
          />
        </View>
      ) : null}
    </View>
  );
}

type DraftCreationStep = {
  id?: string;
  title: string;
  body: string;
  imageUrl?: string | null;
};

export function ProductDraftScreen({
  productId,
  flow,
  initialStep = 1,
}: {
  productId?: string;
  flow?: string;
  initialStep?: number;
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
  const [wizardStep, setWizardStep] = useState(
    Math.min(Math.max(initialStep, 1), 4),
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

  useEffect(() => {
    setWizardStep(Math.min(Math.max(initialStep, 1), 4));
  }, [initialStep]);

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
    onSuccess: async ({ product }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['seller', 'products'] }),
        queryClient.invalidateQueries({
          queryKey: ['seller', 'product', existingProduct?.id],
        }),
      ]);
      if (!existingProduct) {
        router.replace({
          pathname: '/(seller)/products/[id]',
          params: { id: product.id, flow: 'creation', step: '2' },
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

  if (categories.isLoading || (productId && productDetail.isLoading))
    return (
      <DraftShell>
        <PageState title="Загружаем предмет…" loading />
      </DraftShell>
    );
  if (
    categories.isError ||
    !categories.data ||
    (productId && (!productDetail.data || !existingProduct))
  )
    return (
      <DraftShell>
        <AppText role="sectionTitle">Не удалось загрузить предмет</AppText>
        <SecondaryButton
          label="Повторить"
          onPress={() => {
            void categories.refetch();
            void productDetail.refetch();
          }}
        />
      </DraftShell>
    );

  const editable =
    !existingProduct ||
    existingProduct.status === 'DRAFT' ||
    existingProduct.status === 'CHANGES_REQUESTED';
  const productStatus = existingProduct?.status;
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
  const canContinueToCreation = Boolean(
    existingProduct && existingProduct.images.length > 0,
  );
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
    setWizardStep(step);
    if (existingProduct) {
      router.setParams({ flow: 'creation', step: String(step) });
    }
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
    <DraftShell>
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
                      step > wizardStep ||
                      (step === 2 && !existingProduct) ||
                      (step >= 3 && !canContinueToCreation)
                    }
                    onPress={() => moveToWizardStep(step)}
                  />
                );
              },
            )}
          </View>
          {existingProduct ? (
            <AppText role="metadata" tone="secondary">
              Шаг {Math.min(wizardStep, 4)} из 4 ·{' '}
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

      {existingProduct && !isCreationFlow ? (
        <FormSection title="Статус предмета">
          <AppText
            role="bodySmall"
            tone={
              productStatus === 'APPROVED'
                ? 'success'
                : productStatus === 'CHANGES_REQUESTED'
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
          {productStatus === 'APPROVED' ? (
            <PrimaryButton
              label="Создать аукцион"
              onPress={() =>
                router.push({
                  pathname: '/(seller)/listings/new',
                  params: { productId: existingProduct.id },
                })
              }
            />
          ) : null}
          {productStatus !== 'APPROVED' && editable ? (
            <PrimaryButton
              label={
                productStatus === 'CHANGES_REQUESTED'
                  ? 'Повторно отправить на модерацию'
                  : 'Отправить на модерацию'
              }
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

      {!isCreationFlow || wizardStep === 1 ? (
        <FormPageColumns
          sidebar={
            <>
              <FormSection
                title="Характеристики"
                description="Параметры помогают точно описать работу."
              >
                <TextField
                  label="Техника"
                  value={technique}
                  onChangeText={setTechnique}
                  placeholder="Необязательно"
                  editable={editable}
                />
                <TextField
                  label="Материал"
                  value={materials}
                  onChangeText={setMaterials}
                  placeholder="Необязательно"
                  editable={editable}
                />
                <TextField
                  label="Размеры"
                  value={dimensions}
                  onChangeText={setDimensions}
                  placeholder="Необязательно"
                  editable={editable}
                />
                <TextField
                  label="Вес"
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="Необязательно"
                  editable={editable}
                />
                <TextField
                  label="Год создания"
                  value={year}
                  onChangeText={setYear}
                  placeholder="Необязательно"
                  keyboardType="number-pad"
                  editable={editable}
                  error={stepOneAttempted ? stepOneErrors.year : undefined}
                />
              </FormSection>
              <FormSection title="Логистика">
                <TextField
                  label="Город"
                  value={city}
                  onChangeText={setCity}
                  placeholder="Город"
                  editable={editable}
                  required
                  error={stepOneAttempted ? stepOneErrors.city : undefined}
                />
                <TextField
                  label="Упаковка"
                  value={packaging}
                  onChangeText={setPackaging}
                  placeholder="Необязательно"
                  multiline
                  editable={editable}
                />
                <TextField
                  label="Передача или доставка"
                  value={deliveryInfo}
                  onChangeText={setDeliveryInfo}
                  placeholder="Передача или доставка"
                  multiline
                  editable={editable}
                  required
                  error={
                    stepOneAttempted ? stepOneErrors.deliveryInfo : undefined
                  }
                />
              </FormSection>
            </>
          }
        >
          <FormSection title="Категория">
            {categories.data.categories.map((category) => (
              <SecondaryButton
                key={category.id}
                label={
                  categoryId === category.id
                    ? `✓ ${category.name}`
                    : category.name
                }
                disabled={!editable}
                width="block"
                onPress={() => setCategoryId(category.id)}
              />
            ))}
            {stepOneAttempted && stepOneErrors.categoryId ? (
              <AppText role="bodySmall" tone="danger">
                {stepOneErrors.categoryId}
              </AppText>
            ) : null}
          </FormSection>

          <FormSection
            title="О работе"
            description="Основная информация для каталога и страницы предмета."
          >
            <TextField
              label="Название"
              value={title}
              onChangeText={setTitle}
              placeholder="Название"
              editable={editable}
              required
              error={stepOneAttempted ? stepOneErrors.title : undefined}
            />
            <TextField
              label="История предмета"
              value={story}
              onChangeText={setStory}
              placeholder="История предмета"
              multiline
              editable={editable}
              required
              error={stepOneAttempted ? stepOneErrors.story : undefined}
            />
            <TextField
              label="Уникальность или тираж"
              value={uniqueness}
              onChangeText={setUniqueness}
              placeholder="Уникальность или тираж"
              editable={editable}
              required
              error={stepOneAttempted ? stepOneErrors.uniqueness : undefined}
            />
            {condition ? (
              <AppText role="bodySmall" tone="secondary">
                Состояние: {condition}
              </AppText>
            ) : null}
            <TextField
              label="Происхождение"
              value={provenance}
              onChangeText={setProvenance}
              placeholder="Происхождение"
              multiline
              editable={editable}
              required
              error={stepOneAttempted ? stepOneErrors.provenance : undefined}
            />
          </FormSection>
        </FormPageColumns>
      ) : null}

      {!isCreationFlow || wizardStep === 1 ? (
        <AppText role="bodySmall" tone="secondary">
          Дата размещения установится автоматически при первой публичной
          публикации.
        </AppText>
      ) : null}

      {editable && (!isCreationFlow || wizardStep === 1) ? (
        <PrimaryButton
          label={
            isCreationFlow && !existingProduct
              ? 'Сохранить и продолжить'
              : existingProduct
                ? 'Сохранить изменения'
                : 'Сохранить черновик'
          }
          loading={save.isPending}
          width="block"
          onPress={() => {
            if (isCreationFlow) {
              setStepOneAttempted(true);
              if (!canSaveStepOne) return;
            }
            save.mutate();
          }}
        />
      ) : null}
      {save.isError && (!isCreationFlow || wizardStep === 1) ? (
        <AppText role="bodySmall" tone="danger">
          Не удалось сохранить предмет.
        </AppText>
      ) : null}

      {existingProduct && (!isCreationFlow || wizardStep === 2) ? (
        <FormSection title="Изображения">
          <AppText role="bodySmall" tone="secondary">
            {existingProduct.images.length}/10 изображений
          </AppText>
          {productStatus === 'PENDING_REVIEW' ? (
            <AppText role="bodySmall" tone="secondary">
              Изображения нельзя изменить во время модерации.
            </AppText>
          ) : null}
          {existingProduct.images.map((image) => (
            <DraftImageRow
              key={image.id}
              url={image.url}
              position={image.position}
              editable={editable}
              isLast={image.position === existingProduct.images.length - 1}
              isReordering={reorderImages.isPending}
              isRemoving={removeImage.isPending}
              onMove={(direction) => reorder(image.id, direction)}
              onDelete={() => setImagePendingDelete(image.id)}
            />
          ))}
          {editable ? (
            <SecondaryButton
              label="Добавить изображения"
              loading={upload.isPending}
              onPress={() => void chooseImages()}
            />
          ) : null}
          {upload.isError ? (
            <AppText role="bodySmall" tone="danger">
              Не удалось загрузить изображения.
            </AppText>
          ) : null}
          {imageSelectionError ? (
            <AppText role="bodySmall" tone="danger">
              {imageSelectionError}
            </AppText>
          ) : null}
          {removeImage.isError || reorderImages.isError ? (
            <AppText role="bodySmall" tone="danger">
              Не удалось изменить изображения.
            </AppText>
          ) : null}
        </FormSection>
      ) : null}

      {isCreationFlow && wizardStep === 2 && existingProduct ? (
        <View style={{ gap: designTokens.space.x3 }}>
          <AppText role="bodySmall" tone="secondary">
            Первое изображение обязательно. До 10 изображений можно заменить,
            удалить и переставить местами до отправки на модерацию.
          </AppText>
          <SecondaryButton
            label="Назад к описанию"
            onPress={() => moveToWizardStep(1)}
          />
          <PrimaryButton
            label="Продолжить к истории создания"
            disabled={!canContinueToCreation}
            onPress={() => moveToWizardStep(3)}
          />
        </View>
      ) : null}

      {isCreationFlow && wizardStep === 3 && existingProduct ? (
        <FormSection
          title="История создания"
          description="Добавьте контекст, который поможет зрителю понять путь работы. Этот шаг можно оставить пустым."
        >
          <TextField
            label="Введение"
            value={creationIntro}
            onChangeText={(value) => {
              setCreationIntro(value);
              setCreationStorySaved(false);
            }}
            placeholder="Расскажите о замысле и процессе"
            multiline
            editable={editable}
          />
          {creationSteps.map((step, index) => (
            <View
              key={step.id ?? `draft-step-${index}`}
              style={{ gap: designTokens.space.x2 }}
            >
              <AppText role="label">Этап {index + 1}</AppText>
              <TextField
                label="Название этапа"
                value={step.title}
                onChangeText={(value) =>
                  updateCreationStep(index, 'title', value)
                }
                placeholder="Например: Первый эскиз"
                editable={editable}
                error={
                  creationAttempted && !step.title.trim()
                    ? 'Введите название этапа'
                    : undefined
                }
              />
              <TextField
                label="Описание этапа"
                value={step.body}
                onChangeText={(value) =>
                  updateCreationStep(index, 'body', value)
                }
                placeholder="Что происходило на этом этапе"
                multiline
                editable={editable}
                error={
                  creationAttempted && !step.body.trim()
                    ? 'Добавьте описание этапа'
                    : undefined
                }
              />
              {step.id ? (
                <>
                  {step.imageUrl ? (
                    <ResilientRemoteImage
                      uri={getApiAssetUrl(step.imageUrl)}
                      component="CreationStep"
                      accessibilityLabel={`Фотография этапа ${index + 1}`}
                      fallbackLabel={`Фотография этапа ${index + 1} недоступна`}
                      style={{
                        width: '100%',
                        height: 220,
                        borderRadius: designTokens.radius.image,
                      }}
                      contentFit="cover"
                    />
                  ) : null}
                  <SecondaryButton
                    label={
                      step.imageUrl
                        ? 'Заменить фотографию'
                        : 'Добавить фотографию'
                    }
                    loading={uploadCreationStepImage.isPending}
                    disabled={uploadCreationStepImage.isPending || !editable}
                    onPress={() => void chooseCreationStepImage(step.id!)}
                  />
                </>
              ) : null}
              {creationSteps.length > 1 ? (
                <TextButton
                  label="Удалить этап"
                  disabled={replaceCreation.isPending}
                  onPress={() => {
                    setCreationStorySaved(false);
                    setCreationSteps((current) =>
                      current.filter((_item, stepIndex) => stepIndex !== index),
                    );
                  }}
                />
              ) : null}
            </View>
          ))}
          {creationSteps.length < 20 ? (
            <SecondaryButton
              label={
                creationSteps.length === 0
                  ? 'Добавить первый этап'
                  : 'Добавить этап'
              }
              disabled={replaceCreation.isPending}
              onPress={() => {
                setCreationStorySaved(false);
                setCreationSteps((current) => [
                  ...current,
                  { title: '', body: '' },
                ]);
              }}
            />
          ) : null}
          {replaceCreation.isError ? (
            <AppText role="bodySmall" tone="danger">
              Не удалось сохранить историю создания.
            </AppText>
          ) : null}
          {uploadCreationStepImage.isError ? (
            <AppText role="bodySmall" tone="danger">
              Не удалось загрузить фотографию этапа.
            </AppText>
          ) : null}
          {creationImageSelectionError ? (
            <AppText role="bodySmall" tone="danger">
              {creationImageSelectionError}
            </AppText>
          ) : null}
          {creationStorySaved ? (
            <AppText role="bodySmall" tone="success">
              История сохранена. Теперь можно добавить фотографии к новым этапам
              или перейти к проверке.
            </AppText>
          ) : null}
          <SecondaryButton
            label="Назад к изображениям"
            disabled={replaceCreation.isPending}
            onPress={() => moveToWizardStep(2)}
          />
          <PrimaryButton
            label="Сохранить историю"
            loading={replaceCreation.isPending}
            disabled={!editable || creationStorySaved}
            onPress={() => {
              setCreationAttempted(true);
              if (!canSaveCreation) return;
              replaceCreation.mutate();
            }}
          />
          <SecondaryButton
            label="Продолжить к проверке"
            disabled={
              !creationStorySaved ||
              replaceCreation.isPending ||
              uploadCreationStepImage.isPending
            }
            onPress={() => moveToWizardStep(4)}
          />
        </FormSection>
      ) : null}

      {isCreationFlow && wizardStep === 4 && existingProduct ? (
        <FormSection
          title="Проверка перед модерацией"
          description="Проверьте обязательные поля, изображения и историю создания. После отправки редактирование будет ограничено статусом модерации."
        >
          <AppText role="label">
            Название: {existingProduct.title ?? 'Не заполнено'}
          </AppText>
          <AppText role="bodySmall" tone="secondary">
            Изображения: {existingProduct.images.length}/10 · Этапы истории:{' '}
            {
              creationSteps.filter(
                (step) => step.title.trim() && step.body.trim(),
              ).length
            }
          </AppText>
          {wizardSubmitted ? (
            <AppText role="bodySmall" tone="success">
              Предмет отправлен на модерацию.
            </AppText>
          ) : (
            <PrimaryButton
              label="Отправить на модерацию"
              loading={submit.isPending}
              disabled={!editable || existingProduct.images.length < 1}
              onPress={() => submit.mutate(existingProduct.id)}
            />
          )}
          <SecondaryButton
            label="Назад к истории создания"
            disabled={submit.isPending || wizardSubmitted}
            onPress={() => moveToWizardStep(3)}
          />
        </FormSection>
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
    </DraftShell>
  );
}

function DraftShell({ children }: { children: ReactNode }) {
  return <FormPageShell>{children}</FormPageShell>;
}
