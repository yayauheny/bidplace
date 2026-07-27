import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Link, useRouter } from 'expo-router';
import { Text, XStack, YStack } from 'tamagui';

import {
  ErrorState,
  LoadingState,
  StatusBadge,
} from '../../components/ui';
import {
  AppImage,
  AppText,
  MetadataChip,
  ModernField,
  ModernScreen,
  ModernSection,
  PrimaryButton,
  SecondaryButton,
  TextButton,
} from '../../components/modern-ui';
import { useAppThemePalette } from '../../theme/palette';
import { getApiUrl } from '../../lib/environment';
import { useApiClient } from '../../providers/api-provider';
import { mobileSpacing } from '../../theme/tokens';
import { modernColors, modernSpacing } from '../../theme/modern-tokens';

export function ProductDraftScreen({ productId }: { productId?: string }) {
  const api = useApiClient();
  const router = useRouter();
  const palette = useAppThemePalette();
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
    mutationFn: (productIdToSubmit: string) =>
      api.products.submit(productIdToSubmit),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
    },
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
      <ModernScreen mode="seller" width="form">
        <LoadingState label="Загружаем предмет" />
      </ModernScreen>
    );
  if (
    categories.isError ||
    !categories.data ||
    (productId && (!products.data || !existingProduct))
  )
    return (
      <ModernScreen mode="seller" width="form">
        <ErrorState
          description="Не удалось загрузить предмет"
          onAction={() => {
            void categories.refetch();
            void products.refetch();
          }}
        />
      </ModernScreen>
    );
  const editable =
    !existingProduct ||
    existingProduct.status === 'DRAFT' ||
    existingProduct.status === 'CHANGES_REQUESTED';

  return (
    <ModernScreen mode="seller" width="form">
      <YStack style={{ gap: modernSpacing.section }}>
        <YStack style={{ gap: modernSpacing.sm }}>
          <AppText role="screenTitle">{existingProduct ? 'Редактировать предмет' : 'Новый предмет'}</AppText>
          <AppText role="bodySmall" color={modernColors.textSecondary}>Черновик можно сохранить неполным. Для approval нужны все обязательные поля и минимум 1 изображение.</AppText>
        </YStack>

        {existingProduct ? (
          <YStack style={{ gap: mobileSpacing[3] }}>
            <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <MetadataChip tone={existingProduct.status === 'APPROVED' ? 'success' : 'default'}>{existingProduct.status}</MetadataChip>
              <TextButton fullWidth={false} onPress={() => products.refetch()}>
                Обновить
              </TextButton>
            </XStack>
            {existingProduct.status === 'APPROVED' ? (
              <Link href={{ pathname: '/(seller)/listings/new', params: { productId: existingProduct.id } }} asChild>
                <PrimaryButton>Создать аукцион</PrimaryButton>
              </Link>
            ) : null}
            {existingProduct.status !== 'APPROVED' && editable ? (
              <PrimaryButton
                loading={submit.isPending}
                disabled={existingProduct.images.length < 1}
                onPress={() => submit.mutate(existingProduct.id)}
              >
                {existingProduct.status === 'CHANGES_REQUESTED'
                  ? 'Повторно отправить на модерацию'
                  : 'Отправить на модерацию'}
              </PrimaryButton>
            ) : null}
            {existingProduct.status !== 'APPROVED' && existingProduct.images.length < 1 ? (
              <Text style={{ color: palette.colorMuted, fontSize: 13, lineHeight: 18 }}>
                Добавьте хотя бы одно изображение перед отправкой.
              </Text>
            ) : null}
          </YStack>
        ) : null}

        {existingProduct && !editable ? (
          <ModernSection><AppText role="bodySmall" color={modernColors.danger}>Предмет уже нельзя редактировать или изменять его изображения.</AppText></ModernSection>
        ) : null}

        {/* Category */}
        <ModernSection eyebrow="Шаг 1 · Категория">
          <YStack style={{ gap: mobileSpacing[2] }}>
            {categories.data.categories.map((category) => (
              categoryId === category.id ? (
                <PrimaryButton
                  key={category.id}
                  disabled={!editable}
                  onPress={() => setCategoryId(category.id)}
                >
                  {category.name}
                </PrimaryButton>
              ) : (
                <SecondaryButton
                  key={category.id}
                  disabled={!editable}
                  onPress={() => setCategoryId(category.id)}
                >
                  {category.name}
                </SecondaryButton>
              )
            ))}
          </YStack>
        </ModernSection>

        {/* Core fields */}
        <ModernSection eyebrow="Шаг 2 · О предмете">
          <YStack style={{ gap: mobileSpacing[3] }}>
            <ModernField
              label="Название"
              value={title}
              onChangeText={setTitle}
              placeholder="Название"
              editable={editable}
            />
            <ModernField
              label="История предмета"
              value={story}
              onChangeText={setStory}
              placeholder="История предмета"
              multiline
              editable={editable}
            />
            <ModernField
              label="Состояние"
              value={condition}
              onChangeText={setCondition}
              placeholder="Состояние"
              editable={editable}
            />
            <ModernField
              label="Уникальность или тираж"
              value={uniqueness}
              onChangeText={setUniqueness}
              placeholder="Уникальность или тираж"
              editable={editable}
            />
            <ModernField
              label="Происхождение"
              value={provenance}
              onChangeText={setProvenance}
              placeholder="Происхождение"
              multiline
              editable={editable}
            />
          </YStack>
        </ModernSection>

        {/* Technical attributes */}
        <ModernSection eyebrow="Шаг 3 · Характеристики">
          <YStack style={{ gap: mobileSpacing[3] }}>
            <ModernField
              label="Техника"
              value={technique}
              onChangeText={setTechnique}
              placeholder="Техника (необязательно)"
              editable={editable}
            />
            <ModernField
              label="Материалы"
              value={materials}
              onChangeText={setMaterials}
              placeholder="Материалы (необязательно)"
              editable={editable}
            />
            <ModernField
              label="Размеры"
              value={dimensions}
              onChangeText={setDimensions}
              placeholder="Размеры (необязательно)"
              editable={editable}
            />
            <ModernField
              label="Вес"
              value={weight}
              onChangeText={setWeight}
              placeholder="Вес (необязательно)"
              editable={editable}
            />
            <ModernField
              label="Год"
              value={year}
              onChangeText={setYear}
              placeholder="Год (необязательно)"
              keyboardType="number-pad"
              editable={editable}
            />
          </YStack>
        </ModernSection>

        {/* Logistics */}
        <ModernSection eyebrow="Шаг 4 · Передача">
          <YStack style={{ gap: mobileSpacing[3] }}>
            <ModernField
              label="Город"
              value={city}
              onChangeText={setCity}
              placeholder="Город"
              editable={editable}
            />
            <ModernField
              label="Передача или доставка"
              value={deliveryInfo}
              onChangeText={setDeliveryInfo}
              placeholder="Передача или доставка"
              multiline
              editable={editable}
            />
          </YStack>
        </ModernSection>

        {editable ? (
          <PrimaryButton
            loading={save.isPending}
            onPress={() => save.mutate()}
          >
            {existingProduct ? 'Сохранить изменения' : 'Сохранить черновик'}
          </PrimaryButton>
        ) : null}

        {save.isError ? (
          <Text style={{ color: palette.negative }}>
            Не удалось сохранить предмет
          </Text>
        ) : null}

        {/* Images */}
        {existingProduct ? (
          <ModernSection eyebrow="Шаг 5 · Изображения">
            <YStack style={{ gap: mobileSpacing[3] }}>
              {existingProduct.status === 'PENDING_REVIEW' ? (
                <StatusBadge tone="neutral">
                  Изображения нельзя изменить во время модерации
                </StatusBadge>
              ) : null}
              <Text
                style={{ color: palette.colorSecondary, fontSize: 13, lineHeight: 18 }}
              >
                {existingProduct.images.length}/10 изображений
              </Text>
              {existingProduct.images.map((image) => (
                <YStack key={image.id} style={{ gap: mobileSpacing[2] }}>
                  <AppImage uri={`${getApiUrl()}${image.url}`} alt={`Изображение предмета ${image.position + 1}`} ratio={16 / 9} />
                  {editable ? (
                    <YStack style={{ gap: mobileSpacing[1] }}>
                      <SecondaryButton
                        disabled={image.position === 0}
                        loading={reorderImages.isPending}
                        onPress={() => {
                          const ids = existingProduct.images.map(
                            (item) => item.id,
                          );
                          const index = ids.indexOf(image.id);
                          [ids[index - 1], ids[index]] = [
                            ids[index],
                            ids[index - 1],
                          ];
                          reorderImages.mutate(ids);
                        }}
                      >
                        Переместить выше
                      </SecondaryButton>
                      <SecondaryButton
                        disabled={
                          image.position === existingProduct.images.length - 1
                        }
                        loading={reorderImages.isPending}
                        onPress={() => {
                          const ids = existingProduct.images.map(
                            (item) => item.id,
                          );
                          const index = ids.indexOf(image.id);
                          [ids[index], ids[index + 1]] = [
                            ids[index + 1],
                            ids[index],
                          ];
                          reorderImages.mutate(ids);
                        }}
                      >
                        Переместить ниже
                      </SecondaryButton>
                      <TextButton
                        loading={removeImage.isPending}
                        onPress={() => removeImage.mutate(image.id)}
                      >
                        Удалить изображение
                      </TextButton>
                    </YStack>
                  ) : null}
                </YStack>
              ))}
              {editable ? (
                <SecondaryButton
                  loading={upload.isPending}
                  onPress={chooseImages}
                >
                  Добавить изображения
                </SecondaryButton>
              ) : null}
              {upload.isError ? (
                <Text style={{ color: palette.negative }}>
                  Не удалось загрузить изображения
                </Text>
              ) : null}
              {removeImage.isError || reorderImages.isError ? (
                <Text style={{ color: palette.negative }}>
                  Не удалось изменить изображения.
                </Text>
              ) : null}
            </YStack>
          </ModernSection>
        ) : null}
      </YStack>
    </ModernScreen>
  );
}
