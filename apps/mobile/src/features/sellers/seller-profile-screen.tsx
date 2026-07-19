import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@bidplace/api-client';
import { Text, YStack } from 'tamagui';

import {
  AppButton,
  AppInput,
  ErrorState,
  LoadingState,
  Screen,
  SectionHeader,
  StatusBadge,
} from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';
import { useAppThemePalette } from '../../theme/palette';
import { mobileSpacing } from '../../theme/tokens';

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

type SellerStatus = string;

function sellerStatusTone(
  status: SellerStatus,
): 'positive' | 'warning' | 'negative' | 'neutral' {
  if (status === 'APPROVED') return 'positive';
  if (status === 'PENDING') return 'warning';
  if (status === 'SUSPENDED') return 'negative';
  return 'neutral';
}

function sellerStatusLabel(status: SellerStatus): string {
  const labels: Record<string, string> = {
    APPROVED: 'Одобрен',
    PENDING: 'На проверке',
    SUSPENDED: 'Приостановлен',
  };
  return labels[status] ?? status;
}

export function SellerProfileScreen() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const palette = useAppThemePalette();
  const query = useQuery({
    queryKey: ['seller', 'profile'],
    queryFn: () => api.sellers.getMyProfile(),
    retry: false,
  });
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] }),
  });

  if (query.isLoading)
    return (
      <Screen>
        <LoadingState label="Загружаем профиль продавца" />
      </Screen>
    );
  if (
    query.isError &&
    (!(query.error instanceof ApiClientError) ||
      query.error.kind !== 'not_found')
  )
    return (
      <Screen>
        <ErrorState
          description="Не удалось загрузить профиль"
          onAction={() => query.refetch()}
        />
      </Screen>
    );

  const update = (key: keyof ProfileFields, value: string) =>
    setFields((current) => ({ ...current, [key]: value }));

  return (
    <Screen>
      <YStack style={{ gap: mobileSpacing[5] }}>
        <YStack style={{ gap: mobileSpacing[2] }}>
          <SectionHeader title="Профиль продавца" />
          {profile ? (
            <StatusBadge tone={sellerStatusTone(profile.status)}>
              {sellerStatusLabel(profile.status)}
            </StatusBadge>
          ) : (
            <Text
              style={{
                fontSize: 14,
                lineHeight: 20,
                color: palette.colorMuted,
              }}
            >
              Заполните профиль для создания предметов.
            </Text>
          )}
        </YStack>

        <YStack style={{ gap: mobileSpacing[3] }}>
          <AppInput
            label="URL-slug"
            value={fields.slug}
            onChangeText={(value) => update('slug', value)}
            placeholder="my-store"
            autoCapitalize="none"
          />
          <AppInput
            label="Имя или название"
            value={fields.storeName}
            onChangeText={(value) => update('storeName', value)}
            placeholder="Иван Иванов"
          />
          <AppInput
            label="Страна"
            value={fields.country}
            onChangeText={(value) => update('country', value)}
            placeholder="BY"
            autoCapitalize="characters"
          />
          <AppInput
            label="Предпочтительный контакт"
            value={fields.contactPreference}
            onChangeText={(value) => update('contactPreference', value)}
            placeholder="telegram"
            autoCapitalize="none"
          />
          <AppInput
            label="Ссылка на профиль"
            value={fields.socialLink}
            onChangeText={(value) => update('socialLink', value)}
            placeholder="https://t.me/..."
            autoCapitalize="none"
          />
          <AppInput
            label="Короткое описание"
            value={fields.shortDescription}
            onChangeText={(value) => update('shortDescription', value)}
            placeholder="Расскажите о себе"
            multiline
          />
        </YStack>

        <AppButton
          buttonSize="large"
          isLoading={mutation.isPending}
          loadingLabel="Сохраняем"
          onPress={() => mutation.mutate()}
        >
          {profile ? 'Сохранить' : 'Создать профиль'}
        </AppButton>

        {mutation.isError ? (
          <Text
            style={{ color: palette.negative, fontSize: 14, lineHeight: 20 }}
          >
            Не удалось сохранить профиль
          </Text>
        ) : null}
      </YStack>
    </Screen>
  );
}
