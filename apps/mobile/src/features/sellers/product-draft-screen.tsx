import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Text, YStack } from 'tamagui';

import {
  AppButton,
  AppInput,
  ErrorState,
  LoadingState,
  OperationalPanel,
  Screen,
  SectionHeader,
  StatusBadge,
} from '../../components/ui';
import { useAppThemePalette } from '../../theme/palette';
import { getApiUrl } from '../../lib/environment';
import { useApiClient } from '../../providers/api-provider';
import { mobileSpacing } from '../../theme/tokens';

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
      <Screen>
        <LoadingState label="Загружаем предмет" />
      </Screen>
    );
  if (
    categories.isError ||
    !categories.data ||
    (productId && (!products.data || !existingProduct))
  )
    return (
      <Screen>
        <ErrorState
          description="Не удалось загрузить предмет"
          onAction={() => {
            void categories.refetch();
            void products.refetch();
          }}
        />
      </Screen>
    );
  const editable = !existingProduct || existingProduct.status === 'DRAFT';

  return (
    <Screen>
      <YStack style={{ gap: mobileSpacing[5] }}>
        <SectionHeader
          title={existingProduct ? 'Редактировать предмет' : 'Новый предмет'}
          description="Черновик можно сохранить неполным. Для approval нужны все обязательные поля и минимум 3 изображения."
        />

        {existingProduct && !editable ? (
          <OperationalPanel>
            <Text style={{ color: palette.negative }}>
              Предмет уже нельзя редактировать или изменять его изображения.
            </Text>
          </OperationalPanel>
        ) : null}

        {/* Category */}
        <OperationalPanel eyebrow="Категория">
          <YStack style={{ gap: mobileSpacing[2] }}>
            {categories.data.categories.map((category) => (
              <AppButton
                key={category.id}
                tone={categoryId === category.id ? 'primary' : 'secondary'}
                disabled={!editable}
                onPress={() => setCategoryId(category.id)}
              >
                {category.name}
              </AppButton>
            ))}
          </YStack>
        </OperationalPanel>

        {/* Core fields */}
        <OperationalPanel eyebrow="Основное">
          <YStack style={{ gap: mobileSpacing[3] }}>
            <AppInput
              label="Название"
              value={title}
              onChangeText={setTitle}
              placeholder="Название"
              editable={editable}
            />
            <AppInput
              label="История предмета"
              value={story}
              onChangeText={setStory}
              placeholder="История предмета"
              multiline
              editable={editable}
            />
            <AppInput
              label="Состояние"
              value={condition}
              onChangeText={setCondition}
              placeholder="Состояние"
              editable={editable}
            />
            <AppInput
              label="Уникальность или тираж"
              value={uniqueness}
              onChangeText={setUniqueness}
              placeholder="Уникальность или тираж"
              editable={editable}
            />
            <AppInput
              label="Происхождение"
              value={provenance}
              onChangeText={setProvenance}
              placeholder="Происхождение"
              multiline
              editable={editable}
            />
          </YStack>
        </OperationalPanel>

        {/* Technical attributes */}
        <OperationalPanel eyebrow="Технические характеристики">
          <YStack style={{ gap: mobileSpacing[3] }}>
            <AppInput
              label="Техника"
              value={technique}
              onChangeText={setTechnique}
              placeholder="Техника (необязательно)"
              editable={editable}
            />
            <AppInput
              label="Материалы"
              value={materials}
              onChangeText={setMaterials}
              placeholder="Материалы (необязательно)"
              editable={editable}
            />
            <AppInput
              label="Размеры"
              value={dimensions}
              onChangeText={setDimensions}
              placeholder="Размеры (необязательно)"
              editable={editable}
            />
            <AppInput
              label="Вес"
              value={weight}
              onChangeText={setWeight}
              placeholder="Вес (необязательно)"
              editable={editable}
            />
            <AppInput
              label="Год"
              value={year}
              onChangeText={setYear}
              placeholder="Год (необязательно)"
              keyboardType="number-pad"
              editable={editable}
            />
          </YStack>
        </OperationalPanel>

        {/* Logistics */}
        <OperationalPanel eyebrow="Логистика">
          <YStack style={{ gap: mobileSpacing[3] }}>
            <AppInput
              label="Город"
              value={city}
              onChangeText={setCity}
              placeholder="Город"
              editable={editable}
            />
            <AppInput
              label="Передача или доставка"
              value={deliveryInfo}
              onChangeText={setDeliveryInfo}
              placeholder="Передача или доставка"
              multiline
              editable={editable}
            />
          </YStack>
        </OperationalPanel>

        {editable ? (
          <AppButton
            buttonSize="large"
            isLoading={save.isPending}
            onPress={() => save.mutate()}
          >
            {existingProduct ? 'Сохранить изменения' : 'Сохранить черновик'}
          </AppButton>
        ) : null}

        {save.isError ? (
          <Text style={{ color: palette.negative }}>
            Не удалось сохранить предмет
          </Text>
        ) : null}

        {/* Images */}
        {existingProduct ? (
          <OperationalPanel eyebrow="Изображения">
            <YStack style={{ gap: mobileSpacing[3] }}>
              {existingProduct.status !== 'DRAFT' ? (
                <StatusBadge tone="neutral">
                  Изображения нельзя изменить после публикации
                </StatusBadge>
              ) : null}
              <Text
                style={{ color: palette.colorSecondary, fontSize: 13, lineHeight: 18 }}
              >
                {existingProduct.images.length}/10 изображений
              </Text>
              {existingProduct.images.map((image) => (
                <YStack key={image.id} style={{ gap: mobileSpacing[2] }}>
                  <Image
                    source={{ uri: `${getApiUrl()}${image.url}` }}
                    style={{ width: '100%', height: 180 }}
                    contentFit="cover"
                    alt={`Изображение предмета ${image.position + 1}`}
                  />
                  {editable ? (
                    <YStack style={{ gap: mobileSpacing[1] }}>
                      <AppButton
                        tone="secondary"
                        buttonSize="small"
                        disabled={image.position === 0}
                        isLoading={reorderImages.isPending}
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
                      </AppButton>
                      <AppButton
                        tone="secondary"
                        buttonSize="small"
                        disabled={
                          image.position === existingProduct.images.length - 1
                        }
                        isLoading={reorderImages.isPending}
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
                      </AppButton>
                      <AppButton
                        tone="subtle"
                        buttonSize="small"
                        isLoading={removeImage.isPending}
                        onPress={() => removeImage.mutate(image.id)}
                      >
                        Удалить изображение
                      </AppButton>
                    </YStack>
                  ) : null}
                </YStack>
              ))}
              {editable ? (
                <AppButton
                  tone="secondary"
                  isLoading={upload.isPending}
                  onPress={chooseImages}
                >
                  Добавить изображения
                </AppButton>
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
          </OperationalPanel>
        ) : null}
      </YStack>
    </Screen>
  );
}
