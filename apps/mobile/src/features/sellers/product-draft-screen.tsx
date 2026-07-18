import { useState } from 'react';
import { TextInput } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Text, YStack } from 'tamagui';

import { AppButton, ErrorState, LoadingState, Screen } from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';

export function ProductDraftScreen() {
  const api = useApiClient();
  const categories = useQuery({ queryKey: ['products', 'categories'], queryFn: () => api.categories.list() });
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [condition, setCondition] = useState('');
  const [uniqueness, setUniqueness] = useState('');
  const [provenance, setProvenance] = useState('');
  const [city, setCity] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState('');
  const [createdPublicId, setCreatedPublicId] = useState<string | null>(null);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: () => api.products.create({
      categoryId: categoryId || undefined,
      title: title || undefined,
      story: story || undefined,
      condition: condition || undefined,
      uniqueness: uniqueness || undefined,
      provenance: provenance || undefined,
      city: city || undefined,
      deliveryInfo: deliveryInfo || undefined,
    }),
    onSuccess: ({ product }) => { setCreatedProductId(product.id); setCreatedPublicId(product.publicId); },
  });
  const upload = useMutation({ mutationFn: (images: Blob[]) => api.images.add(createdProductId!, images) });
  const chooseImages = async () => {
    if (!createdProductId) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 10, quality: 1 });
    if (result.canceled) return;
    const images = await Promise.all(result.assets.map((asset) => fetch(asset.uri).then((response) => response.blob())));
    upload.mutate(images);
  };

  if (categories.isLoading) return <Screen><LoadingState label="Загружаем категории" /></Screen>;
  if (categories.isError || !categories.data) return <Screen><ErrorState description="Не удалось загрузить категории" onAction={() => categories.refetch()} /></Screen>;
  return <Screen><YStack gap="$3">
    <Text fontSize={30} fontWeight="600">Новый Product</Text>
    <Text>Черновик можно сохранить неполным. Для approval понадобятся все поля и минимум три изображения.</Text>
    <Text>Категория</Text>
    {categories.data.categories.map((category) => <AppButton key={category.id} tone={categoryId === category.id ? 'primary' : 'secondary'} onPress={() => setCategoryId(category.id)}>{category.name}</AppButton>)}
    <TextInput value={title} onChangeText={setTitle} placeholder="Название" />
    <TextInput value={story} onChangeText={setStory} placeholder="История предмета" multiline />
    <TextInput value={condition} onChangeText={setCondition} placeholder="Состояние" />
    <TextInput value={uniqueness} onChangeText={setUniqueness} placeholder="Уникальность или тираж" />
    <TextInput value={provenance} onChangeText={setProvenance} placeholder="Происхождение" multiline />
    <TextInput value={city} onChangeText={setCity} placeholder="Город" />
    <TextInput value={deliveryInfo} onChangeText={setDeliveryInfo} placeholder="Передача или доставка" multiline />
    <AppButton isLoading={create.isPending} onPress={() => create.mutate()}>Сохранить черновик</AppButton>
    {createdPublicId ? <><Text>Черновик сохранён. Добавьте минимум три изображения для approval.</Text><AppButton tone="secondary" isLoading={upload.isPending} onPress={chooseImages}>Добавить изображения</AppButton>{upload.isError ? <Text color="$danger">Не удалось загрузить изображения</Text> : null}</> : null}
    {create.isError ? <Text color="$danger">Не удалось создать Product</Text> : null}
  </YStack></Screen>;
}
