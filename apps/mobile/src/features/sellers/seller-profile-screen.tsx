import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import {
  AppText,
  FormSection,
  ImagePlaceholder,
  PageHeader,
  PageState,
  PrimaryButton,
  ResilientRemoteImage,
  SelectableRow,
  SecondaryButton,
  TextField,
} from '../../components/ui';
import {
  FormPageColumns,
  FormPageShell,
} from '../../components/layout/FormPageShell';
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
  discipline: string;
  country: string;
  socialLink: string;
  telegramUrl: string;
  instagramUrl: string;
  websiteUrl: string;
  shortDescription: string;
  handoffContactType: 'TELEGRAM' | 'PHONE' | 'INSTAGRAM';
  handoffContactValue: string;
  handoffInitiator: 'BUYER_CONTACTS_SELLER' | 'SELLER_CONTACTS_BUYER';
};

const emptyFields: ProfileFields = {
  slug: '',
  fullName: '',
  discipline: '',
  country: 'BY',
  socialLink: '',
  telegramUrl: '',
  instagramUrl: '',
  websiteUrl: '',
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
  const [profileStep, setProfileStep] = useState(1);
  const profile = query.data?.sellerProfile;
  const editable = !profile || profile.status === 'CHANGES_REQUESTED';
  const isProfileCreation = !profile;

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
      discipline: profile.discipline,
      country: profile.country,
      socialLink: profile.socialLink,
      telegramUrl: profile.telegramUrl ?? '',
      instagramUrl: profile.instagramUrl ?? '',
      websiteUrl: profile.websiteUrl ?? '',
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
        discipline: fields.discipline,
        country: fields.country,
        socialLink:
          fields.socialLink ||
          fields.websiteUrl ||
          fields.telegramUrl ||
          fields.instagramUrl,
        telegramUrl: fields.telegramUrl || null,
        instagramUrl: fields.instagramUrl || null,
        websiteUrl: fields.websiteUrl || null,
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

  const hasPublicLink = Boolean(
    fields.socialLink.trim() ||
    fields.telegramUrl.trim() ||
    fields.instagramUrl.trim() ||
    fields.websiteUrl.trim(),
  );
  const canSave = editable && (profile ? true : Boolean(photoBlob));
  const canContinueFromAbout = Boolean(
    fields.fullName.trim() &&
    fields.slug.trim() &&
    fields.discipline.trim() &&
    fields.country.trim() &&
    fields.shortDescription.trim() &&
    photoBlob,
  );
  const canContinueFromLinks = hasPublicLink;
  const canSubmitProfile = Boolean(
    fields.handoffContactValue.trim() && canContinueFromLinks,
  );
  const photoPreview = photoUri;

  return (
    <ProfileShell>
      <View style={{ gap: designTokens.space.x5 }}>
        <View style={{ gap: designTokens.space.x2 }}>
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

        {isProfileCreation ? (
          <FormSection
            title="Создание профиля"
            description="Соберите публичную страницу автора и отдельно укажите закрытые данные для передачи предмета."
          >
            <View
              accessibilityRole="tablist"
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: designTokens.space.x2,
              }}
            >
              {['Об авторе', 'Публичные ссылки', 'Передача и проверка'].map(
                (label, index) => {
                  const step = index + 1;
                  return (
                    <SecondaryButton
                      key={label}
                      label={`${step}. ${label}`}
                      disabled={step > profileStep}
                      onPress={() => setProfileStep(step)}
                    />
                  );
                },
              )}
            </View>
            <AppText role="metadata" tone="secondary">
              Шаг {profileStep} из 3
            </AppText>
          </FormSection>
        ) : null}

        <FormPageColumns
          sidebarFirstOnCompact
          sidebar={
            <FormSection
              title="Фото профиля"
              description="Квадратный портрет или логотип автора."
            >
              {photoPreview && !photoFailed ? (
                photoBlob ? (
                  <Image
                    source={{ uri: photoPreview }}
                    style={{
                      width: '100%',
                      aspectRatio: 1,
                      borderRadius: designTokens.radius.image,
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
                      width: '100%',
                      aspectRatio: 1,
                      borderRadius: designTokens.radius.image,
                    }}
                    contentFit="cover"
                  />
                )
              ) : (
                <ImagePlaceholder
                  ratio={1}
                  label="Фото профиля недоступно или не выбрано"
                  style={{ width: '100%', aspectRatio: 1 }}
                />
              )}
              <SecondaryButton
                label={photoPreview ? 'Изменить фото' : 'Добавить фото'}
                disabled={!editable}
                width="block"
                onPress={() => void choosePhoto()}
              />
              {!profile ? (
                <AppText role="bodySmall" tone="secondary">
                  Фото обязательно для подачи заявки.
                </AppText>
              ) : null}
            </FormSection>
          }
        >
          {(!isProfileCreation || profileStep === 1) && (
            <FormSection
              title="Публичный профиль"
              description="Эти данные увидят коллекционеры на странице автора."
            >
              <TextField
                label="URL-slug"
                value={fields.slug}
                onChangeText={(value) => update('slug', value)}
                placeholder="my-store"
                autoCapitalize="none"
                editable={editable}
                required
              />
              <TextField
                label="Имя или название"
                value={fields.fullName}
                onChangeText={(value) => update('fullName', value)}
                placeholder="Иван Иванов"
                editable={editable}
                required
              />
              <TextField
                label="Страна"
                value={fields.country}
                onChangeText={(value) => update('country', value)}
                placeholder="BY"
                autoCapitalize="characters"
                editable={editable}
                required
              />
              <TextField
                label="Дисциплина"
                value={fields.discipline}
                onChangeText={(value) => update('discipline', value)}
                placeholder="Керамика, живопись, текстиль"
                editable={editable}
                required
              />
              <TextField
                label="Публичная ссылка"
                value={fields.socialLink}
                onChangeText={(value) => update('socialLink', value)}
                placeholder="https://t.me/..."
                autoCapitalize="none"
                editable={editable}
                required
              />
              <TextField
                label="Короткое описание"
                value={fields.shortDescription}
                onChangeText={(value) => update('shortDescription', value)}
                placeholder="Расскажите о себе и своих работах"
                multiline
                editable={editable}
                required
              />
            </FormSection>
          )}
          {(!isProfileCreation || profileStep === 2) && (
            <FormSection
              title="Публичные ссылки"
              description="Эти ссылки попадут на открытую страницу автора."
            >
              <TextField
                label="Telegram"
                value={fields.telegramUrl}
                onChangeText={(value) => update('telegramUrl', value)}
                placeholder="https://t.me/username"
                autoCapitalize="none"
                editable={editable}
              />
              <TextField
                label="Instagram"
                value={fields.instagramUrl}
                onChangeText={(value) => update('instagramUrl', value)}
                placeholder="https://instagram.com/username"
                autoCapitalize="none"
                editable={editable}
              />
              <TextField
                label="Сайт"
                value={fields.websiteUrl}
                onChangeText={(value) => update('websiteUrl', value)}
                placeholder="https://example.com"
                autoCapitalize="none"
                editable={editable}
              />
              <TextField
                label="Основная публичная ссылка"
                value={fields.socialLink}
                onChangeText={(value) => update('socialLink', value)}
                placeholder="Одна ссылка обязательна"
                autoCapitalize="none"
                editable={editable}
                required
              />
              {!hasPublicLink ? (
                <AppText role="bodySmall" tone="danger">
                  Добавьте хотя бы одну публичную ссылку.
                </AppText>
              ) : null}
            </FormSection>
          )}
          {(!isProfileCreation || profileStep === 3) && (
            <FormSection
              title="Передача предмета"
              description="Контакт используется для передачи предмета после завершения аукциона."
            >
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
                    onChangeText={(value) =>
                      update('handoffContactValue', value)
                    }
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
                <View style={{ gap: designTokens.space.x2 }}>
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
            </FormSection>
          )}
        </FormPageColumns>

        {isProfileCreation && profileStep === 3 ? (
          <FormSection
            title="Проверка профиля"
            description="Публичная страница показывает имя, адрес, описание, фото и ссылки. Контакт передачи остаётся закрытым до завершения сделки."
          >
            <AppText role="label">
              {fields.fullName || 'Имя автора'} · @
              {fields.slug || 'profile-address'}
            </AppText>
            <AppText role="bodySmall" tone="secondary">
              {fields.discipline || 'Дисциплина не заполнена'} ·{' '}
              {fields.country || 'Страна не заполнена'}
            </AppText>
          </FormSection>
        ) : null}

        {!editable ? (
          <AppText role="bodySmall" tone="secondary">
            Профиль можно редактировать только после статуса «Нужны правки».
          </AppText>
        ) : null}

        <PrimaryButton
          loading={mutation.isPending}
          disabled={
            !canSave ||
            (isProfileCreation &&
              ((profileStep === 1 && !canContinueFromAbout) ||
                (profileStep === 2 && !canContinueFromLinks) ||
                (profileStep === 3 && !canSubmitProfile)))
          }
          onPress={() => {
            if (!isProfileCreation || profileStep === 3) {
              mutation.mutate();
            } else {
              setProfileStep((current) => current + 1);
            }
          }}
          label={
            profile
              ? 'Сохранить'
              : profileStep === 3
                ? 'Создать профиль'
                : 'Продолжить'
          }
          width="block"
        />

        {profile?.status === 'APPROVED' ? (
          <Link href="/products/new" asChild>
            <PrimaryButton
              label="Создать предмет"
              width="block"
              onPress={() => undefined}
            />
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
  return <FormPageShell>{children}</FormPageShell>;
}
