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

export function ProductDraftScreen({ productId }: { productId?: string }) {
  const api = useApiClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const categories = useQuery({
    queryKey: ['products', 'categories'],
    queryFn: () => api.categories.list(),
  });
  const products = useQuery({
    queryKey: ['seller', 'products'],
    queryFn: () => api.sellers.listProducts(),
    enabled: Boolean(productId),
  });
  const existingProduct = products.data?.products.find(
    (product) => product.id === productId,
  );
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
  const [deliveryInfo, setDeliveryInfo] = useState('');
  const [imagePendingDelete, setImagePendingDelete] = useState<string | null>(
    null,
  );

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
    year: year ? Number(year) : null,
    condition: condition || undefined,
    uniqueness: uniqueness || undefined,
    provenance: provenance || undefined,
    city: city || undefined,
    deliveryInfo: deliveryInfo || undefined,
  });
  const save = useMutation({
    mutationFn: () =>
      existingProduct
        ? api.products.update(existingProduct.id, input())
        : api.products.create(input()),
    onSuccess: async ({ product }) => {
      await queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
      if (!existingProduct)
        router.replace({
          pathname: '/(seller)/products/[id]',
          params: { id: product.id },
        });
    },
  });
  const submit = useMutation({
    mutationFn: (id: string) => api.products.submit(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] }),
  });
  const upload = useMutation({
    mutationFn: (images: Blob[]) => api.images.add(existingProduct!.id, images),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] }),
  });
  const removeImage = useMutation({
    mutationFn: (imageId: string) =>
      api.images.remove(existingProduct!.id, imageId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] }),
  });
  const reorderImages = useMutation({
    mutationFn: (imageIds: string[]) =>
      api.images.reorder(existingProduct!.id, imageIds),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] }),
  });
  const chooseImages = async () => {
    if (!existingProduct) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 1,
    });
    if (result.canceled) return;
    const images = await Promise.all(
      result.assets.map((asset) =>
        fetch(asset.uri).then((response) => response.blob()),
      ),
    );
    upload.mutate(images);
  };

  if (categories.isLoading || (productId && products.isLoading))
    return (
      <DraftShell>
        <PageState title="Загружаем предмет…" loading />
      </DraftShell>
    );
  if (
    categories.isError ||
    !categories.data ||
    (productId && (!products.data || !existingProduct))
  )
    return (
      <DraftShell>
        <AppText role="sectionTitle">Не удалось загрузить предмет</AppText>
        <SecondaryButton
          label="Повторить"
          onPress={() => {
            void categories.refetch();
            void products.refetch();
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

  return (
    <DraftShell>
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

      {existingProduct ? (
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
            onPress={() => void products.refetch()}
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

      {existingProduct && !editable ? (
        <AppText role="bodySmall" tone="danger">
          Предмет уже нельзя редактировать или изменять его изображения.
        </AppText>
      ) : null}

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
              />
              <TextField
                label="Передача или доставка"
                value={deliveryInfo}
                onChangeText={setDeliveryInfo}
                placeholder="Передача или доставка"
                multiline
                editable={editable}
                required
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
          />
          <TextField
            label="История предмета"
            value={story}
            onChangeText={setStory}
            placeholder="История предмета"
            multiline
            editable={editable}
            required
          />
          <TextField
            label="Уникальность или тираж"
            value={uniqueness}
            onChangeText={setUniqueness}
            placeholder="Уникальность или тираж"
            editable={editable}
            required
          />
          <TextField
            label="Состояние"
            value={condition}
            onChangeText={setCondition}
            placeholder="Опишите состояние предмета"
            editable={editable}
            required
          />
          <TextField
            label="Происхождение"
            value={provenance}
            onChangeText={setProvenance}
            placeholder="Происхождение"
            multiline
            editable={editable}
            required
          />
        </FormSection>
      </FormPageColumns>

      <AppText role="bodySmall" tone="secondary">
        Дата размещения установится автоматически при первой публичной
        публикации.
      </AppText>

      {editable ? (
        <PrimaryButton
          label={existingProduct ? 'Сохранить изменения' : 'Сохранить черновик'}
          loading={save.isPending}
          width="block"
          onPress={() => save.mutate()}
        />
      ) : null}
      {save.isError ? (
        <AppText role="bodySmall" tone="danger">
          Не удалось сохранить предмет.
        </AppText>
      ) : null}

      {existingProduct ? (
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
          {removeImage.isError || reorderImages.isError ? (
            <AppText role="bodySmall" tone="danger">
              Не удалось изменить изображения.
            </AppText>
          ) : null}
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
