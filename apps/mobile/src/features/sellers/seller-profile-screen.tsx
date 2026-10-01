import { useCallback, useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
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
import { canWritePrivateCache, currentAuthEpoch, refreshPrivateQuery } from '../../lib/query-cache';
import { usePrivateCacheEpoch } from '../../lib/use-private-cache-epoch';
import { presentEnum, sellerStatusLabels } from '../../lib/presentation';
import { AccountLogoutButton } from '../auth/AccountLogoutButton';
import { useAccountLogout } from '../auth/account-logout';
import { useApiClient } from '../../providers/api-provider';
import { AuthorApplicationAchievements } from './AuthorApplicationAchievements';
import { profileDraftBlocksSave, profileDraftSchema } from './profile-validation';
import { normalizeInstagram, normalizeTelegram } from './contact-normalization';
import { canSubmitSellerProfileRevision, isSellerProfileFormEditable } from './seller-profile-editable';
import { ProfileFieldWriteGuard, SellerProfileCreationStepSelector, SellerProfileFormSteps, SellerProfileVerificationSection, type ProfileFields } from './seller-profile-steps';
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
  const form = useForm<ProfileFields>({
    defaultValues: emptyFields,
    resolver: zodResolver(profileDraftSchema),
    mode: 'onChange',
    shouldUnregister: false,
  });
  const [slug, fullName, country, city, discipline, shortDescription] = useWatch({
    control: form.control,
    name: ['slug', 'fullName', 'country', 'city', 'discipline', 'shortDescription'],
  });
  const profileFieldErrors = form.formState.errors;
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
  const sessionOperation = useRef(0);
  const mountedRef = useRef(true);
  const photoBlobRef = useRef<Blob | null>(null);
  const hydratedProfileToken = useRef<string | null>(null);
  const [inputsLocked, setInputsLocked] = useState(false);
  const [revisionSubmitActive, setRevisionSubmitActive] = useState(false);
  const [achievementWriteActive, setAchievementWriteActive] = useState(false);
  const achievementWriteToken = useRef(0);
  const parentOperationId = useRef(0);
  const fieldsEditableSeen = useRef<boolean | null>(null);
  const accountLogout = useAccountLogout();
  const authEpoch = usePrivateCacheEpoch(queryClient);
  const seenAuthEpoch = useRef(authEpoch);
  const forceProfileHydration = useRef(false);
  const validatedEmptyProfile = useRef(false);
  const draftValidation = useRef({ epoch: 0, running: false });
  const missingProfile = query.isError && query.error instanceof ApiClientError && query.error.kind === 'not_found';
  const queueProfileDraftValidation = useCallback(() => {
    const state = draftValidation.current;
    state.epoch += 1;
    if (state.running) return;
    const run = () => {
      const epoch = state.epoch;
      state.running = true;
      void form.trigger().finally(() => {
        state.running = false;
        if (state.epoch !== epoch) run();
      });
    };
    run();
  }, [form]);
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
  if (fieldsEditableSeen.current === true && !fieldsEditable) {
    parentOperationId.current += 1;
  }
  fieldsEditableSeen.current = fieldsEditable;

  useEffect(() => {
    if (query.isLoading) return;
    if (!profile) {
      if (missingProfile && !validatedEmptyProfile.current) {
        validatedEmptyProfile.current = true;
        queueProfileDraftValidation();
      }
      return;
    }
    const token = hydrationToken ?? null;
    const forced = forceProfileHydration.current;
    if (!token) return;
    if (hydratedProfileToken.current === token && !forced) return;
    if (!forced && form.formState.isDirty) return;
    forceProfileHydration.current = false;
    form.reset(toFields(profile));
    hydratedProfileToken.current = token;
    queueProfileDraftValidation();
  }, [form, form.formState.isDirty, hydrationToken, missingProfile, profile, query.isLoading, queueProfileDraftValidation]);

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
    const epoch = currentAuthEpoch(queryClient);
    void queryClient.invalidateQueries({ queryKey: sellerProfileQueryKey });
    void queryClient.invalidateQueries({ queryKey: ['seller', 'application-photo'] });
    void refreshPrivateQuery(queryClient, ['seller', 'application'], epoch);
  };
  const bumpParentOperation = () => {
    parentOperationId.current += 1;
  };
  const currentParentOperation = () => parentOperationId.current;
  const beginLockedTransition = () => {
    if (transitionLock.current) return false;
    transitionLock.current = true;
    setInputsLocked(true);
    bumpParentOperation();
    return true;
  };
  const endLockedTransition = () => {
    transitionLock.current = false;
    setInputsLocked(false);
  };
  const setAchievementWrite = (token: number, active: boolean) => {
    if (active) {
      achievementWriteToken.current = token;
      setAchievementWriteActive(true);
      return;
    }
    if (achievementWriteToken.current !== token) return;
    achievementWriteToken.current = 0;
    setAchievementWriteActive(false);
  };
  const achievementWriteBlocksParent = () => achievementWriteToken.current !== 0;
  const parentBlocksAchievement = () =>
    transitionLock.current ||
    revisionSubmitInFlight.current ||
    saveInFlight.current ||
    leaving.current ||
    logoutStarted.current ||
    accountLogout.busy;
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  useEffect(() => {
    if (seenAuthEpoch.current === authEpoch) return;
    seenAuthEpoch.current = authEpoch;
    sessionOperation.current += 1;
    photoSelection.current += 1;
    saveInFlight.current = false;
    revisionSubmitInFlight.current = false;
    leaving.current = false;
    logoutStarted.current = false;
    endLockedTransition();
    setRevisionSubmitActive(false);
    parentOperationId.current += 1;
    achievementWriteToken.current = 0;
    setAchievementWriteActive(false);
    photoBlobRef.current = null;
    setPhotoBlob(null);
    setPhotoUri(null);
    forceProfileHydration.current = true;
    validatedEmptyProfile.current = false;
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
    queueProfileDraftValidation();
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
      void refreshPrivateQuery(queryClient, ['seller', 'application'], epoch);
      void queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] });
      queryClient.setQueryData(sellerProfileQueryKey, (current: SellerProfileResponse | undefined) => current ? { ...current, sellerProfile: { ...current.sellerProfile, applicationStage: saved.application.applicationStage } } : current);
    },
  });
  const submitMutation = useMutation({ mutationFn: () => api.portfolio.submitAuthorApplication() });

  const save = async (source?: 'revision-submit' | 'transition') => {
    if (achievementWriteBlocksParent()) return null;
    if (logoutStarted.current || saveInFlight.current) return null;
    if (revisionSubmitInFlight.current && source !== 'revision-submit') return null;
    if (transitionLock.current && source !== 'revision-submit') return null;
    if (source === 'transition' && !beginLockedTransition()) return null;
    bumpParentOperation();
    const variables: ProfileSaveVariables = {
      fields: form.getValues(),
      photo: photoBlobRef.current,
      authEpoch: currentAuthEpoch(queryClient),
    };
    const operation = sessionOperation.current;
    saveInFlight.current = true;
    try {
      const saved = await saveMutation.mutateAsync(variables);
      if (sessionOperation.current !== operation || !canWritePrivateCache(queryClient, variables.authEpoch)) return null;
      return saved;
    } catch (error) {
      if (source === 'transition' && sessionOperation.current === operation) endLockedTransition();
      throw error;
    } finally {
      if (sessionOperation.current === operation) saveInFlight.current = false;
    }
  };
  const submitRevision = async () => {
    if (
      achievementWriteBlocksParent() ||
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
    const operation = sessionOperation.current;
    revisionSubmitInFlight.current = true;
    setRevisionSubmitActive(true);
    const stillOwnsSubmit = () =>
      sessionOperation.current === operation && canWritePrivateCache(queryClient, submitEpoch);
    try {
      const saved = await save('revision-submit');
      if (!saved || !stillOwnsSubmit()) return;
      const submitted = await submitMutation.mutateAsync();
      if (!stillOwnsSubmit()) return;
      await queryClient.cancelQueries({ queryKey: sellerProfileQueryKey }, { revert: false });
      if (!stillOwnsSubmit()) return;
      queryClient.setQueryData<SellerProfileResponse>(sellerProfileQueryKey, (current) =>
        withSubmittedRevision(current, submitted),
      );
      hydratedProfileToken.current = submitted.editingRevision?.updatedAt ?? hydratedProfileToken.current;
      void queryClient.invalidateQueries({ queryKey: ['seller', 'application-photo'] });
      void refreshPrivateQuery(queryClient, ['seller', 'application'], submitEpoch);
      await queryClient.refetchQueries({ queryKey: sellerProfileQueryKey });
    } catch (error) {
      logInfrastructureError(error, 'seller-profile-submit');
    } finally {
      if (sessionOperation.current === operation) {
        revisionSubmitInFlight.current = false;
        setRevisionSubmitActive(false);
        endLockedTransition();
      }
    }
  };
  const continueFromStep = async (visibleStep: 2 | 3) => {
    if (transitionLock.current || achievementWriteBlocksParent()) return;
    const epoch = currentAuthEpoch(queryClient);
    const operation = sessionOperation.current;
    const stillOwnsStep = () =>
      sessionOperation.current === operation && canWritePrivateCache(queryClient, epoch);
    try {
      const saved = await save('transition');
      if (!saved || !stillOwnsStep()) return;
      if (shouldAdvanceSellerApplication(saved.sellerProfile, visibleStep)) {
        await advanceMutation.mutateAsync(epoch);
        if (!stillOwnsStep()) return;
      }
      router.push(`/profile?step=${visibleStep + 1}`);
    } catch (error) {
      logInfrastructureError(error, 'seller-profile-step');
    } finally {
      if (sessionOperation.current === operation) endLockedTransition();
    }
  };
  const choosePhoto = async () => {
    if (!fieldsEditable || transitionLock.current) return;
    const epoch = currentAuthEpoch(queryClient);
    const operation = sessionOperation.current;
    const selection = photoSelection.current + 1;
    photoSelection.current = selection;
    const stillOwnsPhoto = () =>
      selection === photoSelection.current &&
      !transitionLock.current &&
      sessionOperation.current === operation &&
      canWritePrivateCache(queryClient, epoch);
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false, quality: 1 });
    if (!stillOwnsPhoto()) return;
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const blob = await fetch(asset.uri).then((response) => response.blob());
    if (!stillOwnsPhoto()) return;
    photoBlobRef.current = blob;
    setPhotoUri(asset.uri);
    setPhotoFailed(false);
    setPhotoBlob(blob);
  };
  const hasRequiredDetails = Boolean(slug.trim() && fullName.trim() && country.trim() && city.trim() && (profile || photoBlob));
  const hasRequiredAbout = Boolean(discipline.trim() && shortDescription.trim());
  const canSave = editable && !profileDraftBlocksSave(profileFieldErrors);
  const pageStatus = infrastructurePageFetchStatus(query);
  const preview = photoUri ?? (profile ? getApiAssetUrl(profile.profilePhotoUrl) : null);
  const canPersistBeforeExit = canSave && (Boolean(profile) || hasRequiredDetails);
  const exitDescription = profile
    ? 'Черновик уже сохранён. Сохраните последние изменения перед выходом.'
    : canPersistBeforeExit
      ? 'Заполнили первый шаг — сохраним его как черновик перед выходом.'
      : 'Данные первого шага ещё не сохранены и будут потеряны при выходе.';
  const exit = async () => {
    if (
      achievementWriteBlocksParent() ||
      revisionSubmitInFlight.current ||
      saveInFlight.current ||
      transitionLock.current
    ) {
      return;
    }
    if (leaving.current || logoutStarted.current || accountLogout.busy) return;
    leaving.current = true;
    bumpParentOperation();
    const operation = sessionOperation.current;
    const epoch = currentAuthEpoch(queryClient);
    if (canPersistBeforeExit && (form.formState.isDirty || photoBlob)) {
      try {
        const saved = await save('transition');
        if (!saved || sessionOperation.current !== operation || !canWritePrivateCache(queryClient, epoch)) {
          if (sessionOperation.current === operation) leaving.current = false;
          return;
        }
      } catch (error) {
        if (sessionOperation.current === operation) leaving.current = false;
        logInfrastructureError(error, 'seller-profile-exit');
        return;
      }
    }
    if (sessionOperation.current !== operation) return;
    endLockedTransition();
    if (exitIntent === 'logout') {
      logoutStarted.current = true;
      await accountLogout.logout();
      return;
    }
    router.replace('/');
  };
  const releaseTransitionAfterTurn = (operation: number) => {
    queueMicrotask(() => {
      if (!mountedRef.current || sessionOperation.current !== operation) return;
      endLockedTransition();
    });
  };
  const goToPreviousStep = async () => {
    if (
      achievementWriteBlocksParent() ||
      transitionLock.current ||
      revisionSubmitInFlight.current ||
      profileStep <= 1
    ) {
      return;
    }
    const operation = sessionOperation.current;
    const epoch = currentAuthEpoch(queryClient);
    if (shouldSaveBeforeSellerProfileBack(form.formState.isDirty, Boolean(photoBlob))) {
      if (!canSave) return;
      try {
        const saved = await save('transition');
        if (!saved || sessionOperation.current !== operation || !canWritePrivateCache(queryClient, epoch)) return;
      } catch (error) {
        logInfrastructureError(error, 'seller-profile-step');
        return;
      }
      if (sessionOperation.current !== operation) return;
      router.push(`/profile?step=${previousSellerProfileStep(profileStep)}`);
      endLockedTransition();
      return;
    }
    if (!beginLockedTransition()) return;
    if (sessionOperation.current !== operation) return;
    router.push(`/profile?step=${previousSellerProfileStep(profileStep)}`);
    releaseTransitionAfterTurn(operation);
  };
  const requestExit = (intent: 'home' | 'logout') => {
    if (achievementWriteBlocksParent() || transitionLock.current || revisionSubmitInFlight.current || saveInFlight.current || leaving.current || logoutStarted.current || accountLogout.busy) return;
    if (!form.formState.isDirty && !photoBlob) {
      if (intent === 'logout') {
        logoutStarted.current = true;
        bumpParentOperation();
        void accountLogout.logout();
        return;
      }
      const operation = sessionOperation.current;
      if (!beginLockedTransition()) return;
      router.replace('/');
      releaseTransitionAfterTurn(operation);
      return;
    }
    setExitIntent(intent);
    setExitOpen(true);
  };
  const introOpen = intro === '1' && missingProfile;
  const exitDialog = <AppDialog open={exitOpen} title="Выйти из заявки?" description={profile ? (form.formState.isDirty || photoBlob ? 'Последние изменения ещё не сохранены. Сохранить их перед выходом?' : 'Ваш черновик сохранён. Вы сможете продолжить позже.') : exitDescription} onClose={() => setExitOpen(false)}>
    <PrimaryButton label={canPersistBeforeExit ? 'Сохранить и выйти' : 'Выйти без сохранения'} loading={saveMutation.isPending || accountLogout.busy} disabled={revisionSubmitActive || achievementWriteActive} width="block" onPress={() => void exit()} />
    <SecondaryButton label="Продолжить заполнение" disabled={saveMutation.isPending || accountLogout.busy} width="block" onPress={() => setExitOpen(false)} />
  </AppDialog>;
  if (!missingProfile && pageStatus !== 'ready') return <AppShell>
    <InfrastructurePageStatus status={pageStatus} onRetry={() => void query.refetch()} />
    <AccountLogoutButton width="content" pending={saveMutation.isPending || accountLogout.busy || revisionSubmitActive} onPress={() => requestExit('logout')} />
    {exitDialog}
  </AppShell>;

  return <FormProvider {...form}>
    <ProfileFieldWriteGuard guard={transitionLock}>
    <FormPageShell hideDock={isApplicationWizard}>
    <View style={{ gap: designTokens.space.x5 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: designTokens.space.x3 }}>
        <View style={{ flex: 1, gap: designTokens.space.x2 }}>
          <PageHeader title="Профиль автора" description={!profile ? 'Заполните профиль и сохраните черновик до отправки на модерацию.' : undefined} />
        {profile ? <AppText role="caption" tone={profile.status === 'APPROVED' ? 'success' : profile.status === 'REJECTED' ? 'danger' : 'secondary'}>{presentEnum(profile.status, sellerStatusLabels, 'Неизвестный статус')}</AppText> : null}
        </View>
        {introOpen ? null : <AccountLogoutButton width="content" pending={saveMutation.isPending || accountLogout.busy || revisionSubmitActive} onPress={() => requestExit('logout')} />}
        {isApplicationWizard ? <SecondaryButton label="Закрыть" disabled={revisionSubmitActive || inputsLocked || achievementWriteActive} onPress={() => requestExit('home')} /> : null}
      </View>
      {isApplicationWizard ? <SellerProfileCreationStepSelector profileStep={profileStep} /> : null}
      {isApplicationWizard && profileStep > 1 ? <SecondaryButton label="Назад" width="block" loading={saveMutation.isPending} disabled={saveMutation.isPending || accountLogout.busy || revisionSubmitActive || inputsLocked || achievementWriteActive} onPress={() => void goToPreviousStep()} /> : null}
      {(!isApplicationWizard || profileStep === 1) ? <FormPageColumns sidebarFirstOnCompact sidebar={<FormSection title="Фото профиля" description="Квадратный портрет или логотип автора.">
        {preview && !photoFailed ? photoBlob ? <LocalPreviewImage source={{ uri: preview }} resizeMode="cover" style={{ width: '100%', aspectRatio: 1, borderRadius: designTokens.radius.image }} onError={() => setPhotoFailed(true)} /> : <ResilientRemoteImage uri={preview} component="AuthorPhoto" accessibilityLabel="Фото профиля" fallbackLabel="Фото профиля недоступно" style={{ width: '100%', aspectRatio: 1, borderRadius: designTokens.radius.image }} contentFit="cover" /> : <ImagePlaceholder ratio={1} label="Фото профиля недоступно или не выбрано" style={{ width: '100%', aspectRatio: 1 }} />}
        <SecondaryButton label={preview ? 'Изменить фото' : 'Добавить фото'} disabled={!fieldsEditable} width="block" onPress={() => void choosePhoto()} />
        {!profile ? <AppText role="bodySmall" tone="secondary">Фото обязательно для сохранения заявки.</AppText> : null}
      </FormSection>}>
        <SellerProfileFormSteps profileStep={profileStep} showAllSteps={!isApplicationWizard} editable={fieldsEditable} />
      </FormPageColumns> : <SellerProfileFormSteps profileStep={profileStep} showAllSteps={false} editable={fieldsEditable} />}
      {(isApplicationWizard && profileStep === 4) ? <SellerProfileVerificationSection /> : null}
      {shouldShowSellerProfileAchievements(Boolean(profile), isApplicationWizard, profileStep) ? <AuthorApplicationAchievements editable={fieldsEditable} parentBusy={parentBlocksAchievement} parentOperation={currentParentOperation} onChildWrite={setAchievementWrite} /> : null}
      {!editable ? <AppText role="bodySmall" tone="secondary">{editingRevision?.status === 'PENDING_REVIEW' ? 'Заявка на проверке. Редактирование откроется, если модератор запросит правки.' : 'Сейчас профиль нельзя редактировать.'}</AppText> : null}
      {isApplicationWizard && profileStep === 1 ? <PrimaryButton loading={saveMutation.isPending} disabled={!canSave || !hasRequiredDetails || accountLogout.busy || revisionSubmitActive || inputsLocked || achievementWriteActive} onPress={() => void (async () => {
        if (transitionLock.current || achievementWriteBlocksParent()) return;
        const epoch = currentAuthEpoch(queryClient);
        const operation = sessionOperation.current;
        try {
          const saved = await save('transition');
          if (!saved || sessionOperation.current !== operation || !canWritePrivateCache(queryClient, epoch)) return;
          router.push('/profile?step=2');
        } catch (error) {
          logInfrastructureError(error, 'seller-profile-step');
        } finally {
          if (sessionOperation.current === operation) endLockedTransition();
        }
      })()} label="Продолжить" width="block" /> : null}
      {isApplicationWizard && profileStep === 2 && editable ? <PrimaryButton loading={saveMutation.isPending || advanceMutation.isPending} disabled={!canSave || accountLogout.busy || revisionSubmitActive || inputsLocked || achievementWriteActive} onPress={() => void continueFromStep(2)} label="Продолжить" width="block" /> : null}
      {isApplicationWizard && profileStep === 3 && editable ? <PrimaryButton loading={saveMutation.isPending || advanceMutation.isPending} disabled={!canSave || !hasRequiredAbout || accountLogout.busy || revisionSubmitActive || inputsLocked || achievementWriteActive} onPress={() => void continueFromStep(3)} label="Продолжить" width="block" /> : null}
      {isApplicationWizard && profileStep === 4 && editable ? <>
        <PrimaryButton loading={saveMutation.isPending || revisionSubmitActive} disabled={!canSave || accountLogout.busy || revisionSubmitActive || inputsLocked || achievementWriteActive} onPress={() => void save().catch((error) => logInfrastructureError(error, 'seller-profile-save'))} label="Сохранить черновик" width="block" />
        {canSubmitRevision ? <PrimaryButton loading={submitMutation.isPending || revisionSubmitActive} disabled={revisionSubmitActive || saveMutation.isPending || submitMutation.isPending || !canSave || accountLogout.busy || inputsLocked || achievementWriteActive} onPress={() => void submitRevision()} label="Отправить на проверку" width="block" /> : null}
      </> : null}
      {!isApplicationWizard && editable ? <PrimaryButton loading={saveMutation.isPending || revisionSubmitActive} disabled={!canSave || accountLogout.busy || revisionSubmitActive || inputsLocked || achievementWriteActive} onPress={() => void save().catch((error) => logInfrastructureError(error, 'seller-profile-save'))} label="Сохранить" width="block" /> : null}
      {!isApplicationWizard && canSubmitRevision ? <PrimaryButton loading={submitMutation.isPending || revisionSubmitActive} disabled={revisionSubmitActive || saveMutation.isPending || submitMutation.isPending || !canSave || accountLogout.busy || inputsLocked || achievementWriteActive} onPress={() => void submitRevision()} label="Отправить на проверку" width="block" /> : null}
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
    </FormPageShell>
    </ProfileFieldWriteGuard>
  </FormProvider>;
}
