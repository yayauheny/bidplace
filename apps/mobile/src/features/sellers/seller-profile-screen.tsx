import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
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
import { getApiUrl } from '../../lib/environment';
import { useApiClient } from '../../providers/api-provider';
import { useAppThemePalette } from '../../theme/palette';
import { mobileSpacing } from '../../theme/tokens';
import { ApiClientError } from '@bidplace/api-client';

type ProfileFields = {
  slug: string;
  fullName: string;
  country: string;
  socialLink: string;
  shortDescription: string;
  handoffContactType: 'TELEGRAM' | 'PHONE' | 'INSTAGRAM';
  handoffContactValue: string;
  handoffInitiator: 'BUYER_CONTACTS_SELLER' | 'SELLER_CONTACTS_BUYER';
};

const emptyFields: ProfileFields = {
  slug: '',
  fullName: '',
  country: 'BY',
  socialLink: '',
  shortDescription: '',
  handoffContactType: 'TELEGRAM',
  handoffContactValue: '',
  handoffInitiator: 'BUYER_CONTACTS_SELLER',
};

type SellerStatus = string;

function sellerStatusTone(
  status: SellerStatus,
): 'positive' | 'warning' | 'negative' | 'neutral' {
  if (status === 'APPROVED') return 'positive';
  if (status === 'SUSPENDED') return 'negative';
  if (status === 'CHANGES_REQUESTED') return 'warning';
  return 'neutral';
}

function sellerStatusLabel(status: SellerStatus): string {
  const labels: Record<string, string> = {
    APPROVED: 'Одобрен',
    PENDING_REVIEW: 'На модерации',
    CHANGES_REQUESTED: 'Нужны правки',
    REJECTED: 'Отклонён',
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
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const profile = query.data?.sellerProfile;
  const editable = !profile || profile.status === 'CHANGES_REQUESTED';

  useEffect(() => {
    if (!profile) {
      setFields(emptyFields);
      setPhotoUri(null);
      setPhotoBlob(null);
      return;
    }

    setFields({
      slug: profile.slug,
      fullName: profile.fullName,
      country: profile.country,
      socialLink: profile.socialLink,
      shortDescription: profile.shortDescription,
      handoffContactType: profile.handoffContactType,
      handoffContactValue: profile.handoffContactValue,
      handoffInitiator: profile.handoffInitiator,
    });
    setPhotoUri(`${getApiUrl()}${profile.profilePhotoUrl}`);
    setPhotoBlob(null);
  }, [profile]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        slug: fields.slug,
        fullName: fields.fullName,
        country: fields.country,
        socialLink: fields.socialLink,
        shortDescription: fields.shortDescription,
      };

      if (profile) {
        if (!editable) {
          throw new Error('Seller profile is not editable');
        }

        return api.sellers.updateProfile(
          {
            ...payload,
            handoffContactType: fields.handoffContactType,
            handoffContactValue: fields.handoffContactValue,
            handoffInitiator: fields.handoffInitiator,
          },
          photoBlob ?? undefined,
        );
      }

      if (!photoBlob) {
        throw new Error('Profile photo is required');
      }

      return api.sellers.createProfile(
        {
          ...payload,
          sellerType: 'creator',
          handoffContactType: fields.handoffContactType,
          handoffContactValue: fields.handoffContactValue,
          handoffInitiator: fields.handoffInitiator,
        },
        photoBlob,
      );
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] }),
  });

  const choosePhoto = async () => {
    if (!editable) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 1,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset) return;

    const blob = await fetch(asset.uri).then((response) => response.blob());
    setPhotoUri(asset.uri);
    setPhotoBlob(blob);
  };

  if (query.isLoading) {
    return (
      <Screen>
        <LoadingState label="Загружаем профиль продавца" />
      </Screen>
    );
  }

  if (
    query.isError &&
    (!(query.error instanceof ApiClientError) ||
      query.error.kind !== 'not_found')
  ) {
    return (
      <Screen>
        <ErrorState
          description="Не удалось загрузить профиль"
          onAction={() => query.refetch()}
        />
      </Screen>
    );
  }

  const update = (key: keyof ProfileFields, value: string) =>
    setFields((current) => ({ ...current, [key]: value }));

  const canSave = editable && (profile ? true : Boolean(photoBlob));
  const photoPreview = photoUri;

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
              Заполните профиль, чтобы подать заявку на модерацию.
            </Text>
          )}
        </YStack>

        <YStack style={{ gap: mobileSpacing[3] }}>
          <OperationalPanel eyebrow="Фото профиля">
            <YStack style={{ gap: mobileSpacing[3] }}>
              {photoPreview ? (
                <Image
                  source={{ uri: photoPreview }}
                  style={{
                    width: '100%',
                    aspectRatio: 1,
                    borderRadius: 16,
                  }}
                  contentFit="cover"
                />
              ) : (
                <YStack
                  style={{
                    aspectRatio: 1,
                    borderRadius: 16,
                    backgroundColor: palette.surfaceMuted,
                  }}
                />
              )}
              <AppButton
                tone="secondary"
                buttonSize="small"
                disabled={!editable}
                onPress={() => void choosePhoto()}
              >
                {photoPreview ? 'Изменить фото' : 'Добавить фото'}
              </AppButton>
              {!profile ? (
                <Text
                  style={{
                    color: palette.colorMuted,
                    fontSize: 13,
                    lineHeight: 18,
                  }}
                >
                  Фото обязательно для подачи заявки.
                </Text>
              ) : null}
            </YStack>
          </OperationalPanel>

          <AppInput
            label="URL-slug"
            value={fields.slug}
            onChangeText={(value) => update('slug', value)}
            placeholder="my-store"
            autoCapitalize="none"
            editable={editable}
          />
          <AppInput
            label="Имя или название"
            value={fields.fullName}
            onChangeText={(value) => update('fullName', value)}
            placeholder="Иван Иванов"
            editable={editable}
          />
          <AppInput
            label="Страна"
            value={fields.country}
            onChangeText={(value) => update('country', value)}
            placeholder="BY"
            autoCapitalize="characters"
            editable={editable}
          />
          <AppInput
            label="Публичная ссылка"
            value={fields.socialLink}
            onChangeText={(value) => update('socialLink', value)}
            placeholder="https://t.me/..."
            autoCapitalize="none"
            editable={editable}
          />
          <AppInput
            label="Короткое описание"
            value={fields.shortDescription}
            onChangeText={(value) => update('shortDescription', value)}
            placeholder="Расскажите о себе и своих работах"
            multiline
            editable={editable}
          />
          {!profile || editable ? (
            <>
              <AppInput
                label="Способ передачи"
                value={fields.handoffContactType}
                onChangeText={(value) =>
                  update(
                    'handoffContactType',
                    value.toUpperCase() as ProfileFields['handoffContactType'],
                  )
                }
                placeholder="TELEGRAM"
                autoCapitalize="characters"
                editable={editable}
              />
              <AppInput
                label="Контакт для передачи"
                value={fields.handoffContactValue}
                onChangeText={(value) => update('handoffContactValue', value)}
                placeholder="@username или +375..."
                autoCapitalize="none"
                editable={editable}
              />
              <AppInput
                label="Кто начинает контакт"
                value={fields.handoffInitiator}
                onChangeText={(value) =>
                  update(
                    'handoffInitiator',
                    value as ProfileFields['handoffInitiator'],
                  )
                }
                placeholder="BUYER_CONTACTS_SELLER"
                autoCapitalize="characters"
                editable={editable}
              />
            </>
          ) : (
            <OperationalPanel eyebrow="Передача">
              <YStack style={{ gap: mobileSpacing[1] }}>
                <Text style={{ color: palette.colorSecondary }}>
                  {profile.handoffContactType}: {profile.handoffContactValue}
                </Text>
                <Text style={{ color: palette.colorMuted }}>
                  Инициатор: {profile.handoffInitiator}
                </Text>
              </YStack>
            </OperationalPanel>
          )}
        </YStack>

        {!editable ? (
          <Text
            style={{
              color: palette.colorMuted,
              fontSize: 13,
              lineHeight: 18,
            }}
          >
            Профиль можно редактировать только после статуса CHANGES_REQUESTED.
          </Text>
        ) : null}

        <AppButton
          buttonSize="large"
          isLoading={mutation.isPending}
          loadingLabel="Сохраняем"
          disabled={!canSave}
          onPress={() => mutation.mutate()}
        >
          {profile ? 'Сохранить' : 'Создать профиль'}
        </AppButton>

        {profile?.status === 'APPROVED' ? (
          <Link href="/products/new" asChild>
            <AppButton buttonSize="large" tone="primary">
              Создать лот
            </AppButton>
          </Link>
        ) : null}

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
