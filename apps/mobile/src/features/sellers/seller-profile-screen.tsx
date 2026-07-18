import { useEffect, useState } from 'react';
import { TextInput } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@bidplace/api-client';
import { Text, YStack } from 'tamagui';

import { AppButton, ErrorState, LoadingState, Screen } from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';

type ProfileFields = {
  slug: string;
  storeName: string;
  country: string;
  contactPreference: string;
  socialLink: string;
  shortDescription: string;
};

const emptyFields: ProfileFields = {
  slug: '',
  storeName: '',
  country: 'BY',
  contactPreference: 'telegram',
  socialLink: '',
  shortDescription: '',
};

export function SellerProfileScreen() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['seller', 'profile'], queryFn: () => api.sellers.getMyProfile(), retry: false });
  const [fields, setFields] = useState<ProfileFields>(emptyFields);
  const profile = query.data?.sellerProfile;

  useEffect(() => {
    if (!profile) return;
    setFields({
      slug: profile.slug,
      storeName: profile.storeName,
      country: profile.country,
      contactPreference: profile.contactPreference,
      socialLink: profile.socialLink ?? '',
      shortDescription: profile.shortDescription ?? '',
    });
  }, [profile]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        slug: fields.slug,
        storeName: fields.storeName,
        country: fields.country,
        contactPreference: fields.contactPreference,
        socialLink: fields.socialLink || null,
        shortDescription: fields.shortDescription || null,
      };
      return profile
        ? api.sellers.updateProfile(payload)
        : api.sellers.createProfile({ ...payload, sellerType: 'creator' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] }),
  });

  if (query.isLoading) return <Screen><LoadingState label="Загружаем профиль продавца" /></Screen>;
  if (query.isError && (!(query.error instanceof ApiClientError) || query.error.kind !== 'not_found')) return <Screen><ErrorState description="Не удалось загрузить профиль" onAction={() => query.refetch()} /></Screen>;

  const update = (key: keyof ProfileFields, value: string) => setFields((current) => ({ ...current, [key]: value }));
  return <Screen><YStack gap="$3">
    <Text fontSize={30} fontWeight="600">Профиль продавца</Text>
    <Text>{profile ? `Статус: ${profile.status}` : 'Заполните профиль для создания Product.'}</Text>
    <TextInput value={fields.slug} onChangeText={(value) => update('slug', value)} placeholder="slug" autoCapitalize="none" />
    <TextInput value={fields.storeName} onChangeText={(value) => update('storeName', value)} placeholder="Имя или название" />
    <TextInput value={fields.country} onChangeText={(value) => update('country', value)} placeholder="Страна" autoCapitalize="characters" />
    <TextInput value={fields.contactPreference} onChangeText={(value) => update('contactPreference', value)} placeholder="Предпочтительный контакт" />
    <TextInput value={fields.socialLink} onChangeText={(value) => update('socialLink', value)} placeholder="Ссылка на профиль (необязательно)" autoCapitalize="none" />
    <TextInput value={fields.shortDescription} onChangeText={(value) => update('shortDescription', value)} placeholder="Короткое описание (необязательно)" multiline />
    <AppButton isLoading={mutation.isPending} onPress={() => mutation.mutate()}>{profile ? 'Сохранить' : 'Создать профиль'}</AppButton>
    {mutation.isError ? <Text color="$danger">Не удалось сохранить профиль</Text> : null}
  </YStack></Screen>;
}
