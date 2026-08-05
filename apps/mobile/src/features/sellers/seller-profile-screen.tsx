import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { modernTokens } from '@bidplace/design-tokens';
import {
  AppText,
  ImagePlaceholder,
  PageHeader,
  PageState,
  PrimaryButton,
  ResilientRemoteImage,
  SelectableRow,
  SecondaryButton,
  TextField,
} from '../../components/modern-ui';
import { AppShell } from '../../components/layout/AppShell';
import { getApiAssetUrl } from '../../lib/environment';
import { useApiClient } from '../../providers/api-provider';
import { ApiClientError } from '@bidplace/api-client';
import {
  handoffContactTypeLabels,
  handoffInitiatorLabels,
  presentEnum,
  sellerStatusLabels,
} from '../../lib/presentation';

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
  return presentEnum(status, sellerStatusLabels, 'Неизвестный статус продавца');
}

export function SellerProfileScreen() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['seller', 'profile'],
    queryFn: () => api.sellers.getMyProfile(),
    retry: false,
  });
  const [fields, setFields] = useState<ProfileFields>(emptyFields);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const profile = query.data?.sellerProfile;
  const editable = !profile || profile.status === 'CHANGES_REQUESTED';

  useEffect(() => {
    if (!profile) {
      setFields(emptyFields);
      setPhotoUri(null);
      setPhotoFailed(false);
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
    setPhotoUri(getApiAssetUrl(profile.profilePhotoUrl));
    setPhotoFailed(false);
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
    setPhotoFailed(false);
    setPhotoBlob(blob);
  };

  if (query.isLoading) {
    return (
      <ProfileShell>
        <PageState title="Загружаем профиль продавца…" loading />
      </ProfileShell>
    );
  }

  if (
    query.isError &&
    (!(query.error instanceof ApiClientError) ||
      query.error.kind !== 'not_found')
  ) {
    return (
      <ProfileShell>
        <PageState
          title="Не удалось загрузить профиль"
          retry={() => void query.refetch()}
        />
      </ProfileShell>
    );
  }

  const update = (key: keyof ProfileFields, value: string) =>
    setFields((current) => ({ ...current, [key]: value }));

  const canSave = editable && (profile ? true : Boolean(photoBlob));
  const photoPreview = photoUri;

  return (
    <ProfileShell>
      <View style={{ gap: modernTokens.space.x5 }}>
        <View style={{ gap: modernTokens.space.x2 }}>
          <PageHeader
            title="Профиль продавца"
            description={
              !profile
                ? 'Заполните профиль, чтобы подать заявку на модерацию.'
                : undefined
            }
          />
          {profile ? (
            <AppText
              role="caption"
              tone={
                sellerStatusTone(profile.status) === 'negative'
                  ? 'danger'
                  : sellerStatusTone(profile.status) === 'positive'
                    ? 'success'
                    : 'secondary'
              }
            >
              {sellerStatusLabel(profile.status)}
            </AppText>
          ) : null}
        </View>

        <View style={{ gap: modernTokens.space.x3 }}>
          <View
            style={{
              gap: modernTokens.space.x3,
              borderRadius: modernTokens.radius.panel,
              borderWidth: 1,
              borderColor: modernTokens.color.border,
              backgroundColor: modernTokens.color.surface,
              padding: modernTokens.space.x5,
            }}
          >
            <AppText role="metadata" tone="secondary">
              Фото профиля
            </AppText>
            {photoPreview && !photoFailed ? (
              photoBlob ? (
                <Image
                  source={{ uri: photoPreview }}
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: modernTokens.radius.image,
                  }}
                  contentFit="cover"
                  onError={() => setPhotoFailed(true)}
                />
              ) : (
                <ResilientRemoteImage
                  uri={photoPreview}
                  component="AuthorPhoto"
                  accessibilityLabel="Фото профиля"
                  fallbackLabel="Фото профиля недоступно"
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: modernTokens.radius.image,
                  }}
                  contentFit="cover"
                />
              )
            ) : (
              <ImagePlaceholder
                ratio={1}
                label="Фото профиля недоступно или не выбрано"
                style={{ width: 200, height: 200 }}
              />
            )}
            <SecondaryButton
              label={photoPreview ? 'Изменить фото' : 'Добавить фото'}
              disabled={!editable}
              onPress={() => void choosePhoto()}
            />
            {!profile ? (
              <AppText role="bodySmall" tone="secondary">
                Фото обязательно для подачи заявки.
              </AppText>
            ) : null}
          </View>

          <TextField
            label="URL-slug"
            value={fields.slug}
            onChangeText={(value) => update('slug', value)}
            placeholder="my-store"
            autoCapitalize="none"
            editable={editable}
          />
          <TextField
            label="Имя или название"
            value={fields.fullName}
            onChangeText={(value) => update('fullName', value)}
            placeholder="Иван Иванов"
            editable={editable}
          />
          <TextField
            label="Страна"
            value={fields.country}
            onChangeText={(value) => update('country', value)}
            placeholder="BY"
            autoCapitalize="characters"
            editable={editable}
          />
          <TextField
            label="Публичная ссылка"
            value={fields.socialLink}
            onChangeText={(value) => update('socialLink', value)}
            placeholder="https://t.me/..."
            autoCapitalize="none"
            editable={editable}
          />
          <TextField
            label="Короткое описание"
            value={fields.shortDescription}
            onChangeText={(value) => update('shortDescription', value)}
            placeholder="Расскажите о себе и своих работах"
            multiline
            editable={editable}
          />
          {!profile || editable ? (
            <>
              <SelectableRow
                label="Способ передачи"
                value={fields.handoffContactType}
                options={Object.entries(handoffContactTypeLabels).map(
                  ([value, label]) => ({ value, label }),
                )}
                onChange={(value) =>
                  update(
                    'handoffContactType',
                    value as ProfileFields['handoffContactType'],
                  )
                }
                disabled={!editable}
              />
              <TextField
                label="Контакт для передачи"
                value={fields.handoffContactValue}
                onChangeText={(value) => update('handoffContactValue', value)}
                placeholder="@username или +375..."
                autoCapitalize="none"
                editable={editable}
              />
              <SelectableRow
                label="Кто начинает контакт"
                value={fields.handoffInitiator}
                options={Object.entries(handoffInitiatorLabels).map(
                  ([value, label]) => ({ value, label }),
                )}
                onChange={(value) =>
                  update(
                    'handoffInitiator',
                    value as ProfileFields['handoffInitiator'],
                  )
                }
                disabled={!editable}
              />
            </>
          ) : (
            <View
              style={{
                gap: modernTokens.space.x1,
                borderRadius: modernTokens.radius.panel,
                borderWidth: 1,
                borderColor: modernTokens.color.border,
                padding: modernTokens.space.x5,
              }}
            >
              <AppText role="bodySmall" tone="secondary">
                {presentEnum(
                  profile.handoffContactType,
                  handoffContactTypeLabels,
                  'Неизвестный тип контакта',
                )}
                : {profile.handoffContactValue}
              </AppText>
              <AppText role="bodySmall" tone="secondary">
                Инициатор:{' '}
                {presentEnum(
                  profile.handoffInitiator,
                  handoffInitiatorLabels,
                  'Неизвестный режим контакта',
                )}
              </AppText>
            </View>
          )}
        </View>

        {!editable ? (
          <AppText role="bodySmall" tone="secondary">
            Профиль можно редактировать только после статуса «Нужны правки».
          </AppText>
        ) : null}

        <PrimaryButton
          loading={mutation.isPending}
          disabled={!canSave}
          onPress={() => mutation.mutate()}
          label={profile ? 'Сохранить' : 'Создать профиль'}
        />

        {profile?.status === 'APPROVED' ? (
          <Link href="/products/new" asChild>
            <PrimaryButton label="Создать лот" onPress={() => undefined} />
          </Link>
        ) : null}

        {mutation.isError ? (
          <AppText role="bodySmall" tone="danger">
            Не удалось сохранить профиль
          </AppText>
        ) : null}
      </View>
    </ProfileShell>
  );
}

function ProfileShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={{
          width: '100%',
          maxWidth: 760,
          alignSelf: 'center',
          padding: modernTokens.space.x5,
        }}
      >
        <View style={{ gap: modernTokens.space.x5 }}>{children}</View>
      </ScrollView>
    </AppShell>
  );
}
