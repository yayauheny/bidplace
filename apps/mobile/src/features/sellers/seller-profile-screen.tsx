import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Image as LocalPreviewImage, View } from 'react-native';

import { ApiClientError } from '@bidplace/api-client';
import { designTokens } from '@bidplace/design-tokens';
import { AppShell, FormPageColumns, FormPageShell } from '../../components/layout';
import { InfrastructurePageStatus } from '../../components/shared/InfrastructurePageStatus';
import { infrastructurePageFetchStatus } from '../../components/shared/infrastructure-page-status';
import { AppDialog, AppText, FormSection, ImagePlaceholder, PageHeader, PrimaryButton, ResilientRemoteImage, SecondaryButton } from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';
import { presentEnum, sellerStatusLabels } from '../../lib/presentation';
import { useApiClient } from '../../providers/api-provider';
import { AuthorApplicationAchievements } from './AuthorApplicationAchievements';
import { getProfileFieldErrors } from './profile-validation';
import { normalizeInstagram, normalizeTelegram } from './contact-normalization';
import { canSubmitSellerProfileRevision, isSellerProfileFormEditable } from './seller-profile-editable';
import { SellerProfileCreationStepSelector, SellerProfileFormSteps, SellerProfileVerificationSection, type ProfileFields } from './seller-profile-steps';
import { resolveSellerProfileStep, resumeSellerProfileStep, shouldShowSellerProfileAchievements } from './seller-profile-wizard';

const emptyFields: ProfileFields = { slug: '', fullName: '', discipline: '', country: 'BY', city: '', practice: '', socialLink: '', telegramUrl: '', instagramUrl: '', websiteUrl: '', publicEmail: '', shortDescription: '' };

function toFields(profile: {
  slug: string; fullName: string; discipline: string | null; country: string; city: string | null;
  practice: string | null; socialLink: string | null; telegramUrl: string | null;
  instagramUrl: string | null; websiteUrl: string | null; publicEmail?: string | null; shortDescription: string | null;
}): ProfileFields {
  return { slug: profile.slug, fullName: profile.fullName, discipline: profile.discipline ?? '', country: profile.country, city: profile.city ?? '', practice: profile.practice ?? '', socialLink: profile.socialLink ?? '', telegramUrl: profile.telegramUrl ?? '', instagramUrl: profile.instagramUrl ?? '', websiteUrl: profile.websiteUrl ?? '', publicEmail: profile.publicEmail ?? '', shortDescription: profile.shortDescription ?? '' };
}

function useProfileData() {
  const api = useApiClient();
  return useQuery({ queryKey: ['seller', 'profile'], queryFn: () => api.sellers.getMyProfile(), retry: false });
}

export function SellerProfileScreen() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { intro, step } = useLocalSearchParams<{ intro?: string | string[]; step?: string | string[] }>();
  const query = useProfileData();
  const profile = query.data?.sellerProfile;
  const editingRevision = query.data?.editingRevision;
  const form = useForm<ProfileFields>({ defaultValues: emptyFields });
  const fields = form.watch();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const hydrationToken = editingRevision?.updatedAt ?? profile?.updatedAt;
  const requestedStep = resolveSellerProfileStep(step, profile);
  const isApplicationWizard = !profile || ['DRAFT', 'CHANGES_REQUESTED', 'REJECTED'].includes(profile.status);
  const profileStep = isApplicationWizard ? requestedStep : 1;
  const unlockedStep = resumeSellerProfileStep(profile);
  const editable = isSellerProfileFormEditable(profile, editingRevision);
  const canSubmitRevision = canSubmitSellerProfileRevision(profile, editingRevision);
  const applicationPhoto = useQuery({ queryKey: ['seller', 'application-photo', profile?.id, hydrationToken], queryFn: () => api.portfolio.getAuthorApplicationPhoto(), enabled: Boolean(profile) && !photoBlob, retry: false });

  useEffect(() => {
    if (!profile) return;
    if (!form.formState.isDirty) form.reset(toFields(profile));
  }, [form, hydrationToken, profile]);

  useEffect(() => {
    if (!profile || photoBlob || !applicationPhoto.data) return;
    let cancelled = false;
    const reader = new FileReader();
    reader.onloadend = () => { if (!cancelled && typeof reader.result === 'string') { setPhotoUri(reader.result); setPhotoFailed(false); } };
    reader.onerror = () => { if (!cancelled) setPhotoFailed(true); };
    reader.readAsDataURL(applicationPhoto.data);
    return () => { cancelled = true; };
  }, [applicationPhoto.data, photoBlob, profile]);

  useEffect(() => {
    if (typeof step === 'string' && String(requestedStep) !== step) {
      router.setParams({ step: String(requestedStep) });
    }
  }, [requestedStep, router, step]);

  useEffect(() => {
    if (profile && intro === '1') router.setParams({ intro: undefined });
  }, [intro, profile, router]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] });
    void queryClient.invalidateQueries({ queryKey: ['seller', 'application-photo'] });
    void queryClient.invalidateQueries({ queryKey: ['seller', 'application'] });
  };
  const payload = () => ({ slug: fields.slug, fullName: fields.fullName, discipline: fields.discipline.trim() || undefined, country: fields.country, city: fields.city.trim(), practice: fields.practice.trim() || null, socialLink: fields.socialLink.trim() || null, telegramUrl: normalizeTelegram(fields.telegramUrl) ?? null, instagramUrl: normalizeInstagram(fields.instagramUrl) ?? null, websiteUrl: fields.websiteUrl.trim() || null, publicEmail: fields.publicEmail.trim() || null, shortDescription: fields.shortDescription.trim() || undefined });
  const createPayload = () => ({ slug: fields.slug, fullName: fields.fullName, country: fields.country, city: fields.city.trim() });
  const saveMutation = useMutation({
    mutationFn: async () => {
      const current = queryClient.getQueryData<typeof query.data>(['seller', 'profile']);
      if (current?.sellerProfile) return api.sellers.updateProfile(payload(), photoBlob ?? undefined);
      if (!photoBlob) throw new Error('Profile photo is required');
      return api.sellers.createProfile(createPayload(), photoBlob);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(['seller', 'profile'], saved);
      form.reset(toFields(saved.sellerProfile));
      setPhotoBlob(null);
      invalidate();
    },
  });
  const advanceMutation = useMutation({
    mutationFn: () => api.portfolio.advanceAuthorApplication(),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['seller', 'application'] });
      void queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] });
      queryClient.setQueryData(['seller', 'profile'], (current: typeof query.data) => current ? { ...current, sellerProfile: { ...current.sellerProfile, applicationStage: saved.application.applicationStage } } : current);
    },
  });
  const submitMutation = useMutation({ mutationFn: () => api.portfolio.submitAuthorApplication(), onSuccess: invalidate });

  const save = async () => saveMutation.mutateAsync();
  const choosePhoto = async () => {
    if (!editable) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false, quality: 1 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPhotoUri(asset.uri); setPhotoFailed(false); setPhotoBlob(await fetch(asset.uri).then((response) => response.blob()));
  };
  const errors = getProfileFieldErrors(fields);
  const hasRequiredDetails = Boolean(fields.slug.trim() && fields.fullName.trim() && fields.country.trim() && fields.city.trim() && (profile || photoBlob));
  const hasRequiredAbout = Boolean(fields.discipline.trim() && fields.shortDescription.trim());
  const canSave = editable && Object.keys(errors).length === 0;
  const pageStatus = infrastructurePageFetchStatus(query);
  const missingProfile = query.isError && query.error instanceof ApiClientError && query.error.kind === 'not_found';
  if (!missingProfile && pageStatus !== 'ready') return <AppShell><InfrastructurePageStatus status={pageStatus} onRetry={() => void query.refetch()} /></AppShell>;
  const preview = photoUri ?? (profile ? getApiAssetUrl(profile.profilePhotoUrl) : null);
  const canPersistBeforeExit = canSave && (Boolean(profile) || hasRequiredDetails);
  const exitDescription = profile
    ? 'Черновик уже сохранён. Сохраните последние изменения перед выходом.'
    : canPersistBeforeExit
      ? 'Заполнили первый шаг — сохраним его как черновик перед выходом.'
      : 'Данные первого шага ещё не сохранены и будут потеряны при выходе.';
  const exit = async () => {
    if (canPersistBeforeExit && (form.formState.isDirty || photoBlob)) await save();
    router.replace('/');
  };

  return <FormPageShell hideDock={isApplicationWizard}>
    <View style={{ gap: designTokens.space.x5 }}>
      <View style={{ gap: designTokens.space.x2 }}>
        <PageHeader title="Профиль автора" description={!profile ? 'Заполните профиль и сохраните черновик до отправки на модерацию.' : undefined} />
        {profile ? <AppText role="caption" tone={profile.status === 'APPROVED' ? 'success' : profile.status === 'REJECTED' ? 'danger' : 'secondary'}>{presentEnum(profile.status, sellerStatusLabels, 'Неизвестный статус')}</AppText> : null}
      </View>
      {isApplicationWizard ? <SellerProfileCreationStepSelector profileStep={profileStep} unlockedStep={unlockedStep} onStepChange={(next) => router.push(`/profile?step=${next}`)} /> : null}
      <FormPageColumns sidebarFirstOnCompact sidebar={<FormSection title="Фото профиля" description="Квадратный портрет или логотип автора.">
        {preview && !photoFailed ? photoBlob ? <LocalPreviewImage source={{ uri: preview }} resizeMode="cover" style={{ width: '100%', aspectRatio: 1, borderRadius: designTokens.radius.image }} onError={() => setPhotoFailed(true)} /> : <ResilientRemoteImage uri={preview} component="AuthorPhoto" accessibilityLabel="Фото профиля" fallbackLabel="Фото профиля недоступно" style={{ width: '100%', aspectRatio: 1, borderRadius: designTokens.radius.image }} contentFit="cover" /> : <ImagePlaceholder ratio={1} label="Фото профиля недоступно или не выбрано" style={{ width: '100%', aspectRatio: 1 }} />}
        <SecondaryButton label={preview ? 'Изменить фото' : 'Добавить фото'} disabled={!editable} width="block" onPress={() => void choosePhoto()} />
        {!profile ? <AppText role="bodySmall" tone="secondary">Фото обязательно для сохранения заявки.</AppText> : null}
      </FormSection>}>
        <SellerProfileFormSteps profileStep={profileStep} showAllSteps={!isApplicationWizard} editable={editable} fields={fields} fieldErrors={errors} update={(key, value) => form.setValue(key, value, { shouldDirty: true })} />
      </FormPageColumns>
      {(isApplicationWizard && profileStep === 4) ? <SellerProfileVerificationSection fields={fields} /> : null}
      {shouldShowSellerProfileAchievements(Boolean(profile), isApplicationWizard, profileStep) ? <AuthorApplicationAchievements editable={editable} /> : null}
      {!editable ? <AppText role="bodySmall" tone="secondary">{editingRevision?.status === 'PENDING_REVIEW' ? 'Заявка на проверке. Редактирование откроется, если модератор запросит правки.' : 'Сейчас профиль нельзя редактировать.'}</AppText> : null}
      {isApplicationWizard && profileStep === 1 ? <PrimaryButton loading={saveMutation.isPending} disabled={!canSave || !hasRequiredDetails} onPress={() => void save().then(() => router.push('/profile?step=2'))} label="Продолжить" width="block" /> : null}
      {isApplicationWizard && profileStep === 2 && editable ? <PrimaryButton loading={saveMutation.isPending || advanceMutation.isPending} disabled={!canSave} onPress={() => void save().then(() => advanceMutation.mutateAsync()).then(() => router.push('/profile?step=3'))} label="Продолжить" width="block" /> : null}
      {isApplicationWizard && profileStep === 3 && editable ? <PrimaryButton loading={saveMutation.isPending || advanceMutation.isPending} disabled={!canSave || !hasRequiredAbout} onPress={() => void save().then(() => advanceMutation.mutateAsync()).then(() => router.push('/profile?step=4'))} label="Продолжить" width="block" /> : null}
      {isApplicationWizard && profileStep === 4 && editable ? <>
        <PrimaryButton loading={saveMutation.isPending} disabled={!canSave} onPress={() => void save()} label="Сохранить черновик" width="block" />
        {canSubmitRevision ? <PrimaryButton loading={submitMutation.isPending} disabled={saveMutation.isPending || submitMutation.isPending || !canSave} onPress={() => void save().then(() => submitMutation.mutateAsync())} label="Отправить на проверку" width="block" /> : null}
      </> : null}
      {!isApplicationWizard && editable ? <PrimaryButton loading={saveMutation.isPending} disabled={!canSave} onPress={() => void save()} label="Сохранить" width="block" /> : null}
      {profile?.status === 'APPROVED' ? <Link href="/products/new" asChild><PrimaryButton label="Создать предмет" width="block" onPress={() => undefined} /></Link> : null}
      {isApplicationWizard ? <SecondaryButton label="Выйти" width="block" onPress={() => {
        if (!form.formState.isDirty && !photoBlob) router.replace('/');
        else setExitOpen(true);
      }} /> : null}
      {saveMutation.isError ? <AppText role="bodySmall" tone="danger">Не удалось сохранить профиль</AppText> : null}
      {submitMutation.isError ? <AppText role="bodySmall" tone="danger">Не удалось отправить заявку: заполните обязательные поля и попробуйте снова.</AppText> : null}
      <AppDialog open={intro === '1' && missingProfile} title="Стать автором" description="Заполните четыре шага. Черновик сохраняется и его можно продолжить позже." onClose={() => router.replace('/profile')}>
        <PrimaryButton label="Начать заявку" width="block" onPress={() => router.replace('/profile?step=1')} />
        <SecondaryButton label="Позже" width="block" onPress={() => router.replace('/')} />
      </AppDialog>
      <AppDialog open={exitOpen} title="Выйти из заявки?" description={exitDescription} onClose={() => setExitOpen(false)}>
        <PrimaryButton label={canPersistBeforeExit ? 'Сохранить и выйти' : 'Выйти без сохранения'} loading={saveMutation.isPending} width="block" onPress={() => void exit()} />
        <SecondaryButton label="Продолжить заполнение" disabled={saveMutation.isPending} width="block" onPress={() => setExitOpen(false)} />
      </AppDialog>
    </View>
  </FormPageShell>;
}
