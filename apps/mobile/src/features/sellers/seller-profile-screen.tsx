import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Image as LocalPreviewImage, View } from 'react-native';

import { ApiClientError } from '@bidplace/api-client';
import type { SellerProfileResponse } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';
import { AppShell, FormPageColumns, FormPageShell } from '../../components/layout';
import { InfrastructurePageStatus } from '../../components/shared/InfrastructurePageStatus';
import { infrastructurePageFetchStatus } from '../../components/shared/infrastructure-page-status';
import { AppDialog, AppText, FormSection, ImagePlaceholder, PageHeader, PrimaryButton, ResilientRemoteImage, SecondaryButton } from '../../components/ui';
import { logInfrastructureError } from '../../errors';
import { getApiAssetUrl } from '../../lib/environment';
import { canWritePrivateCache, currentAuthEpoch } from '../../lib/query-cache';
import { usePrivateCacheEpoch } from '../../lib/use-private-cache-epoch';
import { presentEnum, sellerStatusLabels } from '../../lib/presentation';
import { AccountLogoutButton } from '../auth/AccountLogoutButton';
import { useAccountLogout } from '../auth/account-logout';
import { useApiClient } from '../../providers/api-provider';
import { AuthorApplicationAchievements } from './AuthorApplicationAchievements';
import { getProfileFieldErrors } from './profile-validation';
import { normalizeInstagram, normalizeTelegram } from './contact-normalization';
import { canSubmitSellerProfileRevision, isSellerProfileFormEditable } from './seller-profile-editable';
import { SellerProfileCreationStepSelector, SellerProfileFormSteps, SellerProfileVerificationSection, type ProfileFields } from './seller-profile-steps';
import { previousSellerProfileStep, resolveSellerProfileStep, shouldAdvanceSellerApplication, shouldSaveBeforeSellerProfileBack, shouldShowSellerProfileAchievements } from './seller-profile-wizard';
import { persistedFieldOverrides } from './reconcile-saved-fields';

const emptyFields: ProfileFields = { slug: '', fullName: '', discipline: '', country: 'BY', city: '', practice: '', socialLink: '', telegramUrl: '', instagramUrl: '', websiteUrl: '', publicEmail: '', shortDescription: '' };
const sellerProfileQueryKey = ['seller', 'profile'] as const;

type SubmittedAuthorApplication = {
  application: {
    slug: string;
    fullName: string;
    country: string;
    city: string | null;
    discipline: string | null;
    practice: string | null;
    shortDescription: string | null;
    status: SellerProfileResponse['sellerProfile']['status'];
    applicationStage: SellerProfileResponse['sellerProfile']['applicationStage'];
  };
  editingRevision: {
    id: string;
    version: number;
    status: string;
    updatedAt: string;
  } | null;
};

function withSubmittedRevision(
  current: SellerProfileResponse | undefined,
  submitted: SubmittedAuthorApplication,
): SellerProfileResponse | undefined {
  const revision = submitted.editingRevision;
  if (!current?.sellerProfile || !revision || revision.status !== 'PENDING_REVIEW') {
    return current;
  }
  return {
    sellerProfile: {
      ...current.sellerProfile,
      slug: submitted.application.slug,
      fullName: submitted.application.fullName,
      country: submitted.application.country,
      city: submitted.application.city,
      discipline: submitted.application.discipline,
      practice: submitted.application.practice,
      shortDescription: submitted.application.shortDescription,
      status: submitted.application.status,
      applicationStage: submitted.application.applicationStage,
    },
    editingRevision: {
      id: revision.id,
      version: revision.version,
      status: 'PENDING_REVIEW',
      updatedAt: revision.updatedAt,
    },
  };
}

function isSellerProfileResponse(value: unknown): value is SellerProfileResponse {
  if (!value || typeof value !== 'object') return false;
  return 'sellerProfile' in value && 'editingRevision' in value;
}

function keepConfirmedPendingProfile(previous: unknown, next: unknown): unknown {
  if (!isSellerProfileResponse(previous) || previous.editingRevision?.status !== 'PENDING_REVIEW') {
    return next;
  }
  if (!isSellerProfileResponse(next) || !next.editingRevision) return previous;
  const confirmedAt = Date.parse(previous.editingRevision.updatedAt);
  const incomingAt = Date.parse(next.editingRevision.updatedAt);
  if (!Number.isFinite(incomingAt) || incomingAt < confirmedAt) return previous;
  if (
    next.editingRevision.id === previous.editingRevision.id &&
    next.editingRevision.status !== 'PENDING_REVIEW' &&
    incomingAt <= confirmedAt
  ) {
    return previous;
  }
  return next;
}

function toFields(profile: {
  slug: string; fullName: string; discipline: string | null; country: string; city: string | null;
  practice: string | null; socialLink: string | null; telegramUrl: string | null;
  instagramUrl: string | null; websiteUrl: string | null; publicEmail?: string | null; shortDescription: string | null;
}): ProfileFields {
  return { slug: profile.slug, fullName: profile.fullName, discipline: profile.discipline ?? '', country: profile.country, city: profile.city ?? '', practice: profile.practice ?? '', socialLink: profile.socialLink ?? '', telegramUrl: profile.telegramUrl ?? '', instagramUrl: profile.instagramUrl ?? '', websiteUrl: profile.websiteUrl ?? '', publicEmail: profile.publicEmail ?? '', shortDescription: profile.shortDescription ?? '' };
}

function profileFieldsToUpdate(fields: ProfileFields) {
  return {
    slug: fields.slug,
    fullName: fields.fullName,
    discipline: fields.discipline.trim() || undefined,
    country: fields.country,
    city: fields.city.trim(),
    practice: fields.practice.trim() || null,
    socialLink: fields.socialLink.trim() || null,
    telegramUrl: normalizeTelegram(fields.telegramUrl) ?? null,
    instagramUrl: normalizeInstagram(fields.instagramUrl) ?? null,
    websiteUrl: fields.websiteUrl.trim() || null,
    publicEmail: fields.publicEmail.trim() || null,
    shortDescription: fields.shortDescription.trim() || undefined,
  };
}

function profileFieldsToCreate(fields: ProfileFields) {
  return {
    slug: fields.slug,
    fullName: fields.fullName,
    country: fields.country,
    city: fields.city.trim(),
  };
}

type ProfileSaveVariables = {
  fields: ProfileFields;
  photo: Blob | null;
  authEpoch: number;
};

function useProfileData() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: sellerProfileQueryKey,
    queryFn: async () => {
      const epoch = currentAuthEpoch(queryClient);
      const result = await api.sellers.getMyProfile();
      if (!canWritePrivateCache(queryClient, epoch)) {
        const current = queryClient.getQueryData<SellerProfileResponse>(sellerProfileQueryKey);
        if (current) return current;
        throw new Error('Private cache is closed');
      }
      return result;
    },
    retry: false,
    structuralSharing: keepConfirmedPendingProfile,
  });
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
  const [exitIntent, setExitIntent] = useState<'home' | 'logout'>('home');
  const leaving = useRef(false);
  const saveInFlight = useRef(false);
  const logoutStarted = useRef(false);
  const revisionSubmitInFlight = useRef(false);
  const transitionLock = useRef(false);
  const photoSelection = useRef(0);
  const photoBlobRef = useRef<Blob | null>(null);
  const hydratedProfileToken = useRef<string | null>(null);
  const [inputsLocked, setInputsLocked] = useState(false);
  const [revisionSubmitActive, setRevisionSubmitActive] = useState(false);
  const accountLogout = useAccountLogout();
  const authEpoch = usePrivateCacheEpoch(queryClient);
  const seenAuthEpoch = useRef(authEpoch);
  const forceProfileHydration = useRef(false);
  const hydrationToken = editingRevision?.updatedAt ?? profile?.updatedAt;
  const requestedStep = resolveSellerProfileStep(step, profile);
  const isApplicationWizard = !profile || ['DRAFT', 'CHANGES_REQUESTED', 'REJECTED'].includes(profile.status);
  const profileStep = isApplicationWizard ? requestedStep : 1;
  const editable = isSellerProfileFormEditable(profile, editingRevision);
  const canSubmitRevision = canSubmitSellerProfileRevision(profile, editingRevision);
  const applicationPhoto = useQuery({
    queryKey: ['seller', 'application-photo', profile?.id, hydrationToken],
    queryFn: async () => {
      const epoch = currentAuthEpoch(queryClient);
      const photo = await api.portfolio.getAuthorApplicationPhoto();
      if (!canWritePrivateCache(queryClient, epoch)) {
        throw new Error('Private cache is closed');
      }
      return photo;
    },
    enabled: Boolean(profile) && !photoBlob,
    retry: false,
  });

  const fieldsEditable = editable && !inputsLocked;

  useEffect(() => {
    if (!profile) return;
    const token = hydrationToken ?? null;
    const forced = forceProfileHydration.current;
    if (!token || hydratedProfileToken.current === token) return;
    if (!forced && form.formState.isDirty) return;
    forceProfileHydration.current = false;
    form.reset(toFields(profile));
    hydratedProfileToken.current = token;
  }, [form, form.formState.isDirty, hydrationToken, profile]);

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
    if (!canWritePrivateCache(queryClient)) return;
    void queryClient.invalidateQueries({ queryKey: sellerProfileQueryKey });
    void queryClient.invalidateQueries({ queryKey: ['seller', 'application-photo'] });
    void queryClient.invalidateQueries({ queryKey: ['seller', 'application'] });
  };
  const beginLockedTransition = () => {
    if (transitionLock.current) return false;
    transitionLock.current = true;
    setInputsLocked(true);
    return true;
  };
  const endLockedTransition = () => {
    transitionLock.current = false;
    setInputsLocked(false);
  };
  useEffect(() => {
    if (seenAuthEpoch.current === authEpoch) return;
    seenAuthEpoch.current = authEpoch;
    endLockedTransition();
    photoBlobRef.current = null;
    setPhotoBlob(null);
    setPhotoUri(null);
    forceProfileHydration.current = true;
  }, [authEpoch]);
  const rememberSavedProfile = (saved: SellerProfileResponse, submitted: ProfileFields) => {
    const persisted = toFields(saved.sellerProfile);
    const overrides = persistedFieldOverrides(submitted, form.getValues(), persisted);
    form.reset(persisted);
    for (const field of Object.keys(overrides) as Array<keyof ProfileFields>) {
      const value = overrides[field];
      if (value === undefined) continue;
      form.setValue(field, value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    }
  };
  const saveMutation = useMutation({
    mutationFn: async (variables: ProfileSaveVariables) => {
      const current = queryClient.getQueryData<SellerProfileResponse>(sellerProfileQueryKey);
      if (current?.sellerProfile) return api.sellers.updateProfile(profileFieldsToUpdate(variables.fields), variables.photo ?? undefined);
      if (!variables.photo) throw new Error('Profile photo is required');
      return api.sellers.createProfile(profileFieldsToCreate(variables.fields), variables.photo);
    },
    onSuccess: (saved, variables) => {
      if (!canWritePrivateCache(queryClient, variables.authEpoch)) return;
      rememberSavedProfile(saved, variables.fields);
      if (photoBlobRef.current === variables.photo) {
        photoBlobRef.current = null;
        setPhotoBlob(null);
      }
      queryClient.setQueryData(sellerProfileQueryKey, saved);
      hydratedProfileToken.current = saved.editingRevision?.updatedAt ?? saved.sellerProfile.updatedAt;
      invalidate();
    },
  });
  const advanceMutation = useMutation({
    mutationFn: async (epoch: number) => ({
      saved: await api.portfolio.advanceAuthorApplication(),
      epoch,
    }),
    onSuccess: ({ saved, epoch }) => {
      if (!canWritePrivateCache(queryClient, epoch)) return;
      void queryClient.invalidateQueries({ queryKey: ['seller', 'application'] });
      void queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] });
      queryClient.setQueryData(sellerProfileQueryKey, (current: SellerProfileResponse | undefined) => current ? { ...current, sellerProfile: { ...current.sellerProfile, applicationStage: saved.application.applicationStage } } : current);
    },
  });
  const submitMutation = useMutation({ mutationFn: () => api.portfolio.submitAuthorApplication() });

  const save = async (source?: 'revision-submit' | 'transition') => {
    if (logoutStarted.current || saveInFlight.current) return null;
    if (revisionSubmitInFlight.current && source !== 'revision-submit') return null;
    if (transitionLock.current && source !== 'revision-submit') return null;
    if (source === 'transition' && !beginLockedTransition()) return null;
    const variables: ProfileSaveVariables = {
      fields: form.getValues(),
      photo: photoBlobRef.current,
      authEpoch: currentAuthEpoch(queryClient),
    };
    saveInFlight.current = true;
    try {
      const saved = await saveMutation.mutateAsync(variables);
      if (!canWritePrivateCache(queryClient, variables.authEpoch)) return null;
      return saved;
    } catch (error) {
      if (source === 'transition') endLockedTransition();
      throw error;
    } finally {
      saveInFlight.current = false;
    }
  };
  const submitRevision = async () => {
    if (
      revisionSubmitInFlight.current ||
      logoutStarted.current ||
      saveInFlight.current ||
      leaving.current ||
      accountLogout.busy ||
      transitionLock.current
    ) {
      return;
    }
    if (!beginLockedTransition()) return;
    const submitEpoch = currentAuthEpoch(queryClient);
    revisionSubmitInFlight.current = true;
    setRevisionSubmitActive(true);
    try {
      const saved = await save('revision-submit');
      if (!saved || !canWritePrivateCache(queryClient, submitEpoch)) return;
      const submitted = await submitMutation.mutateAsync();
      if (!canWritePrivateCache(queryClient, submitEpoch)) return;
      await queryClient.cancelQueries({ queryKey: sellerProfileQueryKey }, { revert: false });
      if (canWritePrivateCache(queryClient, submitEpoch)) {
        queryClient.setQueryData<SellerProfileResponse>(sellerProfileQueryKey, (current) =>
          withSubmittedRevision(current, submitted),
        );
        hydratedProfileToken.current = submitted.editingRevision?.updatedAt ?? hydratedProfileToken.current;
        void queryClient.invalidateQueries({ queryKey: ['seller', 'application-photo'] });
        void queryClient.invalidateQueries({ queryKey: ['seller', 'application'] });
        await queryClient.refetchQueries({ queryKey: sellerProfileQueryKey });
      }
    } catch (error) {
      logInfrastructureError(error, 'seller-profile-submit');
    } finally {
      revisionSubmitInFlight.current = false;
      setRevisionSubmitActive(false);
      endLockedTransition();
    }
  };
  const continueFromStep = async (visibleStep: 2 | 3) => {
    if (transitionLock.current) return;
    try {
      const epoch = currentAuthEpoch(queryClient);
      const saved = await save('transition');
      if (!saved || !canWritePrivateCache(queryClient, epoch)) return;
      if (shouldAdvanceSellerApplication(saved.sellerProfile, visibleStep)) {
        await advanceMutation.mutateAsync(epoch);
        if (!canWritePrivateCache(queryClient, epoch)) return;
      }
      router.push(`/profile?step=${visibleStep + 1}`);
    } catch (error) {
      logInfrastructureError(error, 'seller-profile-step');
    } finally {
      endLockedTransition();
    }
  };
  const choosePhoto = async () => {
    if (!fieldsEditable || transitionLock.current) return;
    const selection = photoSelection.current + 1;
    photoSelection.current = selection;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false, quality: 1 });
    if (selection !== photoSelection.current || transitionLock.current) return;
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const blob = await fetch(asset.uri).then((response) => response.blob());
    if (selection !== photoSelection.current || transitionLock.current) return;
    photoBlobRef.current = blob;
    setPhotoUri(asset.uri);
    setPhotoFailed(false);
    setPhotoBlob(blob);
  };
  const errors = getProfileFieldErrors(fields);
  const hasRequiredDetails = Boolean(fields.slug.trim() && fields.fullName.trim() && fields.country.trim() && fields.city.trim() && (profile || photoBlob));
  const hasRequiredAbout = Boolean(fields.discipline.trim() && fields.shortDescription.trim());
  const canSave = editable && Object.keys(errors).length === 0;
  const pageStatus = infrastructurePageFetchStatus(query);
  const missingProfile = query.isError && query.error instanceof ApiClientError && query.error.kind === 'not_found';
  const preview = photoUri ?? (profile ? getApiAssetUrl(profile.profilePhotoUrl) : null);
  const canPersistBeforeExit = canSave && (Boolean(profile) || hasRequiredDetails);
  const exitDescription = profile
    ? 'Черновик уже сохранён. Сохраните последние изменения перед выходом.'
    : canPersistBeforeExit
      ? 'Заполнили первый шаг — сохраним его как черновик перед выходом.'
      : 'Данные первого шага ещё не сохранены и будут потеряны при выходе.';
  const exit = async () => {
    if (revisionSubmitInFlight.current || saveInFlight.current || transitionLock.current) return;
    if (leaving.current || logoutStarted.current || accountLogout.busy) return;
    leaving.current = true;
    if (canPersistBeforeExit && (form.formState.isDirty || photoBlob)) {
      try {
        const saved = await save('transition');
        if (!saved) {
          leaving.current = false;
          return;
        }
      } catch (error) {
        leaving.current = false;
        logInfrastructureError(error, 'seller-profile-exit');
        return;
      }
    }
    endLockedTransition();
    if (exitIntent === 'logout') {
      logoutStarted.current = true;
      await accountLogout.logout();
      return;
    }
    router.replace('/');
  };
  const goToPreviousStep = async () => {
    if (transitionLock.current || revisionSubmitInFlight.current || profileStep <= 1) return;
    if (shouldSaveBeforeSellerProfileBack(form.formState.isDirty, Boolean(photoBlob))) {
      if (!canSave) return;
      try {
        const saved = await save('transition');
        if (!saved) return;
      } catch (error) {
        logInfrastructureError(error, 'seller-profile-step');
        return;
      }
    }
    router.push(`/profile?step=${previousSellerProfileStep(profileStep)}`);
    endLockedTransition();
  };
  const requestExit = (intent: 'home' | 'logout') => {
    if (transitionLock.current || revisionSubmitInFlight.current || saveInFlight.current || leaving.current || logoutStarted.current || accountLogout.busy) return;
    if (!form.formState.isDirty && !photoBlob) {
      if (intent === 'logout') {
        logoutStarted.current = true;
        void accountLogout.logout();
        return;
      }
      router.replace('/');
      return;
    }
    setExitIntent(intent);
    setExitOpen(true);
  };
  const updateField = (key: keyof ProfileFields, value: string) => {
    if (transitionLock.current) return;
    form.setValue(key, value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
  };
  const introOpen = intro === '1' && missingProfile;
  const exitDialog = <AppDialog open={exitOpen} title="Выйти из заявки?" description={profile ? (form.formState.isDirty || photoBlob ? 'Последние изменения ещё не сохранены. Сохранить их перед выходом?' : 'Ваш черновик сохранён. Вы сможете продолжить позже.') : exitDescription} onClose={() => setExitOpen(false)}>
    <PrimaryButton label={canPersistBeforeExit ? 'Сохранить и выйти' : 'Выйти без сохранения'} loading={saveMutation.isPending || accountLogout.busy} disabled={revisionSubmitActive} width="block" onPress={() => void exit()} />
    <SecondaryButton label="Продолжить заполнение" disabled={saveMutation.isPending || accountLogout.busy} width="block" onPress={() => setExitOpen(false)} />
  </AppDialog>;
  if (!missingProfile && pageStatus !== 'ready') return <AppShell>
    <InfrastructurePageStatus status={pageStatus} onRetry={() => void query.refetch()} />
    <AccountLogoutButton width="content" pending={saveMutation.isPending || accountLogout.busy || revisionSubmitActive} onPress={() => requestExit('logout')} />
    {exitDialog}
  </AppShell>;

  return <FormPageShell hideDock={isApplicationWizard}>
    <View style={{ gap: designTokens.space.x5 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: designTokens.space.x3 }}>
        <View style={{ flex: 1, gap: designTokens.space.x2 }}>
          <PageHeader title="Профиль автора" description={!profile ? 'Заполните профиль и сохраните черновик до отправки на модерацию.' : undefined} />
        {profile ? <AppText role="caption" tone={profile.status === 'APPROVED' ? 'success' : profile.status === 'REJECTED' ? 'danger' : 'secondary'}>{presentEnum(profile.status, sellerStatusLabels, 'Неизвестный статус')}</AppText> : null}
        </View>
        {introOpen ? null : <AccountLogoutButton width="content" pending={saveMutation.isPending || accountLogout.busy || revisionSubmitActive} onPress={() => requestExit('logout')} />}
        {isApplicationWizard ? <SecondaryButton label="Закрыть" disabled={revisionSubmitActive || inputsLocked} onPress={() => requestExit('home')} /> : null}
      </View>
      {isApplicationWizard ? <SellerProfileCreationStepSelector profileStep={profileStep} /> : null}
      {isApplicationWizard && profileStep > 1 ? <SecondaryButton label="Назад" width="block" loading={saveMutation.isPending} disabled={saveMutation.isPending || accountLogout.busy || revisionSubmitActive || inputsLocked} onPress={() => void goToPreviousStep()} /> : null}
      {(!isApplicationWizard || profileStep === 1) ? <FormPageColumns sidebarFirstOnCompact sidebar={<FormSection title="Фото профиля" description="Квадратный портрет или логотип автора.">
        {preview && !photoFailed ? photoBlob ? <LocalPreviewImage source={{ uri: preview }} resizeMode="cover" style={{ width: '100%', aspectRatio: 1, borderRadius: designTokens.radius.image }} onError={() => setPhotoFailed(true)} /> : <ResilientRemoteImage uri={preview} component="AuthorPhoto" accessibilityLabel="Фото профиля" fallbackLabel="Фото профиля недоступно" style={{ width: '100%', aspectRatio: 1, borderRadius: designTokens.radius.image }} contentFit="cover" /> : <ImagePlaceholder ratio={1} label="Фото профиля недоступно или не выбрано" style={{ width: '100%', aspectRatio: 1 }} />}
        <SecondaryButton label={preview ? 'Изменить фото' : 'Добавить фото'} disabled={!fieldsEditable} width="block" onPress={() => void choosePhoto()} />
        {!profile ? <AppText role="bodySmall" tone="secondary">Фото обязательно для сохранения заявки.</AppText> : null}
      </FormSection>}>
        <SellerProfileFormSteps profileStep={profileStep} showAllSteps={!isApplicationWizard} editable={fieldsEditable} fields={fields} fieldErrors={errors} update={updateField} />
      </FormPageColumns> : <SellerProfileFormSteps profileStep={profileStep} showAllSteps={false} editable={fieldsEditable} fields={fields} fieldErrors={errors} update={updateField} />}
      {(isApplicationWizard && profileStep === 4) ? <SellerProfileVerificationSection fields={fields} /> : null}
      {shouldShowSellerProfileAchievements(Boolean(profile), isApplicationWizard, profileStep) ? <AuthorApplicationAchievements editable={fieldsEditable} /> : null}
      {!editable ? <AppText role="bodySmall" tone="secondary">{editingRevision?.status === 'PENDING_REVIEW' ? 'Заявка на проверке. Редактирование откроется, если модератор запросит правки.' : 'Сейчас профиль нельзя редактировать.'}</AppText> : null}
      {isApplicationWizard && profileStep === 1 ? <PrimaryButton loading={saveMutation.isPending} disabled={!canSave || !hasRequiredDetails || accountLogout.busy || revisionSubmitActive || inputsLocked} onPress={() => void (async () => {
        if (transitionLock.current) return;
        try {
          const epoch = currentAuthEpoch(queryClient);
          const saved = await save('transition');
          if (!saved || !canWritePrivateCache(queryClient, epoch)) return;
          router.push('/profile?step=2');
        } catch (error) {
          logInfrastructureError(error, 'seller-profile-step');
        } finally {
          endLockedTransition();
        }
      })()} label="Продолжить" width="block" /> : null}
      {isApplicationWizard && profileStep === 2 && editable ? <PrimaryButton loading={saveMutation.isPending || advanceMutation.isPending} disabled={!canSave || accountLogout.busy || revisionSubmitActive || inputsLocked} onPress={() => void continueFromStep(2)} label="Продолжить" width="block" /> : null}
      {isApplicationWizard && profileStep === 3 && editable ? <PrimaryButton loading={saveMutation.isPending || advanceMutation.isPending} disabled={!canSave || !hasRequiredAbout || accountLogout.busy || revisionSubmitActive || inputsLocked} onPress={() => void continueFromStep(3)} label="Продолжить" width="block" /> : null}
      {isApplicationWizard && profileStep === 4 && editable ? <>
        <PrimaryButton loading={saveMutation.isPending || revisionSubmitActive} disabled={!canSave || accountLogout.busy || revisionSubmitActive || inputsLocked} onPress={() => void save().catch((error) => logInfrastructureError(error, 'seller-profile-save'))} label="Сохранить черновик" width="block" />
        {canSubmitRevision ? <PrimaryButton loading={submitMutation.isPending || revisionSubmitActive} disabled={revisionSubmitActive || saveMutation.isPending || submitMutation.isPending || !canSave || accountLogout.busy || inputsLocked} onPress={() => void submitRevision()} label="Отправить на проверку" width="block" /> : null}
      </> : null}
      {!isApplicationWizard && editable ? <PrimaryButton loading={saveMutation.isPending || revisionSubmitActive} disabled={!canSave || accountLogout.busy || revisionSubmitActive || inputsLocked} onPress={() => void save().catch((error) => logInfrastructureError(error, 'seller-profile-save'))} label="Сохранить" width="block" /> : null}
      {!isApplicationWizard && canSubmitRevision ? <PrimaryButton loading={submitMutation.isPending || revisionSubmitActive} disabled={revisionSubmitActive || saveMutation.isPending || submitMutation.isPending || !canSave || accountLogout.busy || inputsLocked} onPress={() => void submitRevision()} label="Отправить на проверку" width="block" /> : null}
      {profile?.status === 'APPROVED' ? <Link href="/products/new" asChild><PrimaryButton label="Создать предмет" width="block" onPress={() => undefined} /></Link> : null}
      {saveMutation.isError ? <AppText role="bodySmall" tone="danger">Не удалось сохранить профиль</AppText> : null}
      {submitMutation.isError ? <AppText role="bodySmall" tone="danger">Не удалось отправить заявку: заполните обязательные поля и попробуйте снова.</AppText> : null}
      <AppDialog open={introOpen} title="Стать автором на Bidplace" description="Создайте профиль автора, расскажите о себе и публикуйте свои работы." onClose={() => router.replace('/profile')}>
        <PrimaryButton label="Начать" width="block" onPress={() => router.replace('/profile?step=1')} />
        <SecondaryButton label="Позже" width="block" onPress={() => router.replace('/')} />
        <AccountLogoutButton width="block" pending={saveMutation.isPending || accountLogout.busy} onPress={() => requestExit('logout')} />
      </AppDialog>
      {exitDialog}
    </View>
  </FormPageShell>;
}
