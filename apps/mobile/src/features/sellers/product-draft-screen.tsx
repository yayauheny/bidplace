import { useEffect, useState } from 'react';
import { TextInput } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Text, YStack } from 'tamagui';

import {
  AppButton,
  ErrorState,
  LoadingState,
  Screen,
} from '../../components/ui';
import { getApiUrl } from '../../lib/environment';
import { useApiClient } from '../../providers/api-provider';

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
      if (!existingProduct) router.replace(`/(seller)/products/${product.id}`);
    },
  });
  const upload = useMutation({
    mutationFn: (images: Blob[]) => api.images.add(existingProduct!.id, images),
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
        <LoadingState label="Загружаем Product" />
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
          description="Не удалось загрузить Product"
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
      <YStack gap="$3">
        <Text fontSize={30} fontWeight="600">
          {existingProduct ? 'Редактировать Product' : 'Новый Product'}
        </Text>
        <Text>
          Черновик можно сохранить неполным. Для approval понадобятся все
          обязательные поля и минимум три изображения.
        </Text>
        {existingProduct && !editable ? (
          <Text color="$danger">
            Product уже нельзя редактировать или изменять его изображения.
          </Text>
        ) : null}
        <Text>Категория</Text>
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
        <TextInput
          editable={editable}
          value={title}
          onChangeText={setTitle}
          placeholder="Название"
        />
        <TextInput
          editable={editable}
          value={story}
          onChangeText={setStory}
          placeholder="История предмета"
          multiline
        />
        <TextInput
          editable={editable}
          value={technique}
          onChangeText={setTechnique}
          placeholder="Техника (необязательно)"
        />
        <TextInput
          editable={editable}
          value={materials}
          onChangeText={setMaterials}
          placeholder="Материалы (необязательно)"
        />
        <TextInput
          editable={editable}
          value={dimensions}
          onChangeText={setDimensions}
          placeholder="Размеры (необязательно)"
        />
        <TextInput
          editable={editable}
          value={weight}
          onChangeText={setWeight}
          placeholder="Вес (необязательно)"
        />
        <TextInput
          editable={editable}
          value={year}
          onChangeText={setYear}
          placeholder="Год (необязательно)"
          keyboardType="number-pad"
        />
        <TextInput
          editable={editable}
          value={condition}
          onChangeText={setCondition}
          placeholder="Состояние"
        />
        <TextInput
          editable={editable}
          value={uniqueness}
          onChangeText={setUniqueness}
          placeholder="Уникальность или тираж"
        />
        <TextInput
          editable={editable}
          value={provenance}
          onChangeText={setProvenance}
          placeholder="Происхождение"
          multiline
        />
        <TextInput
          editable={editable}
          value={city}
          onChangeText={setCity}
          placeholder="Город"
        />
        <TextInput
          editable={editable}
          value={deliveryInfo}
          onChangeText={setDeliveryInfo}
          placeholder="Передача или доставка"
          multiline
        />
        {editable ? (
          <AppButton isLoading={save.isPending} onPress={() => save.mutate()}>
            {existingProduct ? 'Сохранить изменения' : 'Сохранить черновик'}
          </AppButton>
        ) : null}
        {existingProduct ? (
          <>
            <Text>Изображений: {existingProduct.images.length}/10</Text>
            {existingProduct.images.map((image) => (
              <Image
                key={image.id}
                source={{ uri: `${getApiUrl()}${image.url}` }}
                style={{ width: '100%', height: 180 }}
                contentFit="cover"
                accessibilityLabel={`Изображение Product ${image.position + 1}`}
              />
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
              <Text color="$danger">Не удалось загрузить изображения</Text>
            ) : null}
          </>
        ) : null}
        {save.isError ? (
          <Text color="$danger">Не удалось сохранить Product</Text>
        ) : null}
      </YStack>
    </Screen>
  );
}
