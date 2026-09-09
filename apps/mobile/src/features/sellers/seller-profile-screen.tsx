import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import {
  AppText,
  FormSection,
  ImagePlaceholder,
  PageHeader,
  PageState,
  PrimaryButton,
  SecondaryButton,
} from '../../components/ui';
import {
  FormPageColumns,
  FormPageShell,
  WizardProgress,
} from '../../components/layout';
import { useApiClient } from '../../providers/api-provider';
import { ApiClientError } from '@bidplace/api-client';
import { presentEnum, sellerStatusLabels } from '../../lib/presentation';
import {
  getHandoffContactError,
  getProfileFieldErrors,
} from './profile-validation';
import {
  canSubmitSellerProfileRevision,
  isSellerProfileFormEditable,
} from './seller-profile-editable';
import {
  SellerProfileFormSteps,
  SellerProfileVerificationSection,
  type ProfileFields,
} from './seller-profile-steps';
import {
  authorApplicationStep,
  authorApplicationStepCount,
  authorApplicationStepDescriptions,
  authorApplicationStepTitles,
} from './seller-profile-wizard';

const emptyFields: ProfileFields = {
  slug: '',
  fullName: '',
  discipline: '',
  country: 'BY',
  city: '',
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
  const router = useRouter();
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
  const editingRevision = query.data?.editingRevision;
  const editable = isSellerProfileFormEditable(profile, editingRevision);
  const canSubmitRevision = canSubmitSellerProfileRevision(
    profile,
    editingRevision,
  );
  const isProfileCreation = !profile;
  const applicationPhoto = useQuery({
    queryKey: ['seller', 'application-photo', profile?.id],
    queryFn: () => api.portfolio.getAuthorApplicationPhoto(),
    enabled: Boolean(profile) && !photoBlob,
    retry: false,
  });

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
      city: profile.city ?? '',
      socialLink: profile.socialLink,
      telegramUrl: profile.telegramUrl ?? '',
      instagramUrl: profile.instagramUrl ?? '',
      websiteUrl: profile.websiteUrl ?? '',
      shortDescription: profile.shortDescription,
      handoffContactType: profile.handoffContactType,
      handoffContactValue: profile.handoffContactValue,
      handoffInitiator: profile.handoffInitiator,
    });
    setPhotoFailed(false);
    setPhotoBlob(null);
  }, [profile]);

  useEffect(() => {
    if (photoBlob || !applicationPhoto.data) return;
    let cancelled = false;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (cancelled || typeof reader.result !== 'string') return;
      setPhotoUri(reader.result);
      setPhotoFailed(false);
    };
    reader.onerror = () => {
      if (!cancelled) setPhotoFailed(true);
    };
    reader.readAsDataURL(applicationPhoto.data);
    return () => {
      cancelled = true;
    };
  }, [applicationPhoto.data, photoBlob]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        slug: fields.slug,
        fullName: fields.fullName,
        discipline: fields.discipline,
        country: fields.country,
        city: fields.city.trim(),
        socialLink:
          fields.socialLink.trim() ||
          fields.websiteUrl.trim() ||
          fields.telegramUrl.trim() ||
          fields.instagramUrl.trim(),
        telegramUrl: fields.telegramUrl.trim() || null,
        instagramUrl: fields.instagramUrl.trim() || null,
        websiteUrl: fields.websiteUrl.trim() || null,
        shortDescription: fields.shortDescription.trim(),
      };

      if (profile) {
        if (!editable) {
          throw new Error('Seller profile is not editable');
        }

        if (profile.status === 'APPROVED') {
          return api.sellers.updateProfile(payload, photoBlob ?? undefined);
        }

        return api.sellers.updateProfile(
          {
            ...payload,
            handoffContactType: fields.handoffContactType,
            handoffContactValue: fields.handoffContactValue.trim(),
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] });
      void queryClient.invalidateQueries({
        queryKey: ['seller', 'application-photo'],
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => api.portfolio.submitAuthorApplication(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] });
      void queryClient.invalidateQueries({
        queryKey: ['seller', 'application-photo'],
      });
    },
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
      <FormPageShell>
        <PageState title="Загружаем профиль продавца…" loading />
      </FormPageShell>
    );
  }

  if (
    query.isError &&
    (!(query.error instanceof ApiClientError) ||
      query.error.kind !== 'not_found')
  ) {
    return (
      <FormPageShell>
        <PageState
          title="Не удалось загрузить профиль"
          retry={() => void query.refetch()}
        />
      </FormPageShell>
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
  const fieldErrors = getProfileFieldErrors(fields);
  const handoffContactError = getHandoffContactError(
    fields.handoffContactType,
    fields.handoffContactValue,
  );
  const canSave =
    editable &&
    (profile ? Object.keys(fieldErrors).length === 0 : Boolean(photoBlob));
  const canContinueFromIdentity = Boolean(
    fields.fullName.trim() &&
    fields.slug.trim() &&
    fields.country.trim() &&
    fields.city.trim() &&
    (Boolean(photoBlob) || Boolean(profile)) &&
    !fieldErrors.city,
  );
  const canContinueFromAbout = Boolean(
    fields.discipline.trim() && fields.shortDescription.trim(),
  );
  const canContinueFromLinks =
    hasPublicLink &&
    !fieldErrors.socialLink &&
    !fieldErrors.telegramUrl &&
    !fieldErrors.instagramUrl &&
    !fieldErrors.websiteUrl;
  const canSubmitProfile = Boolean(
    fields.handoffContactValue.trim() &&
    !handoffContactError &&
    canContinueFromLinks,
  );
  const photoPreview = photoUri;
  const profileForSteps = profile
    ? {
        handoffContactType: profile.handoffContactType,
        handoffContactValue: profile.handoffContactValue,
        handoffInitiator: profile.handoffInitiator,
      }
    : null;

  return (
    <FormPageShell>
      <View style={{ gap: designTokens.space.x5 }}>
        {isProfileCreation ? (
          <WizardProgress
            step={profileStep}
            total={authorApplicationStepCount}
            title={
              authorApplicationStepTitles[
                profileStep as keyof typeof authorApplicationStepTitles
              ]
            }
            description={
              authorApplicationStepDescriptions[
                profileStep as keyof typeof authorApplicationStepDescriptions
              ]
            }
            onBack={
              profileStep > authorApplicationStep.identity
                ? () => setProfileStep((current) => current - 1)
                : () => router.push('/')
            }
            onClose={() => router.push('/')}
          />
        ) : (
          <View style={{ gap: designTokens.space.x2 }}>
            <PageHeader
              title="Профиль автора"
              description={undefined}
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
        )}

        {(!isProfileCreation ||
        profileStep === authorApplicationStep.identity) ? (
        <FormPageColumns
          sidebarFirstOnCompact
          sidebar={
            <FormSection
              title="Фото профиля"
              description="Разместите лицо в центре кадра."
            >
              {photoPreview && !photoFailed ? (
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
                <ImagePlaceholder
                  ratio={1}
                  label="Фото профиля недоступно или не выбрано"
                  style={{ width: '100%', aspectRatio: 1 }}
                />
              )}
              <SecondaryButton
                label={photoPreview ? 'Изменить фото' : 'Добавить фото'}
                disabled={!editable}
                width="full"
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
          <SellerProfileFormSteps
            isProfileCreation={isProfileCreation}
            profileStep={profileStep}
            editable={editable}
            fields={fields}
            profile={profileForSteps}
            fieldErrors={fieldErrors}
            hasPublicLink={hasPublicLink}
            handoffContactError={handoffContactError}
            update={update}
          />
        </FormPageColumns>
        ) : (
          <SellerProfileFormSteps
            isProfileCreation={isProfileCreation}
            profileStep={profileStep}
            editable={editable}
            fields={fields}
            profile={profileForSteps}
            fieldErrors={fieldErrors}
            hasPublicLink={hasPublicLink}
            handoffContactError={handoffContactError}
            update={update}
          />
        )}

        <SellerProfileVerificationSection
          isProfileCreation={isProfileCreation}
          profileStep={profileStep}
          fields={fields}
        />

        {!editable ? (
          <AppText role="bodySmall" tone="secondary">
            {editingRevision?.status === 'PENDING_REVIEW'
              ? 'Заявка на проверке. Редактирование откроется, если модератор запросит правки.'
              : 'Сейчас профиль нельзя редактировать.'}
          </AppText>
        ) : null}

        <PrimaryButton
          loading={mutation.isPending}
          disabled={
            !canSave ||
            (isProfileCreation &&
              ((profileStep === authorApplicationStep.identity &&
                !canContinueFromIdentity) ||
                (profileStep === authorApplicationStep.about &&
                  !canContinueFromAbout) ||
                (profileStep === authorApplicationStep.contacts &&
                  !canContinueFromLinks) ||
                (profileStep === authorApplicationStep.handoff &&
                  !canSubmitProfile)))
          }
          onPress={() => {
            if (!isProfileCreation || profileStep === authorApplicationStep.handoff) {
              mutation.mutate();
            } else {
              setProfileStep((current) => current + 1);
            }
          }}
          label={
            profile
              ? 'Сохранить'
              : profileStep === authorApplicationStep.handoff
                ? 'Создать профиль'
                : 'Продолжить'
          }
          width="full"
        />

        {canSubmitRevision ? (
          <PrimaryButton
            loading={submitMutation.isPending}
            disabled={submitMutation.isPending || mutation.isPending}
            onPress={() => submitMutation.mutate()}
            label="Отправить на проверку"
            width="block"
          />
        ) : null}

        {profile ? (
          <Link href="/orders" asChild>
            <SecondaryButton
              label="Сделки"
              width="block"
              onPress={() => undefined}
            />
          </Link>
        ) : null}

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
        {submitMutation.isError ? (
          <AppText role="bodySmall" tone="danger">
            Не удалось отправить заявку на проверку
          </AppText>
        ) : null}
      </View>
    </FormPageShell>
  );
}
