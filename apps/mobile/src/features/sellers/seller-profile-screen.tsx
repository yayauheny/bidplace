import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { ApiClientError } from '@bidplace/api-client';
import type { SellerProfileResponse } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';
import { AppShell, FormPageShell } from '../../components/layout';
import { MediaDeliveryNotice } from '../../components/shared/MediaDeliveryNotice';
import { InfrastructurePageStatus } from '../../components/shared/InfrastructurePageStatus';
import { infrastructurePageFetchStatus } from '../../components/shared/infrastructure-page-status';
import {
  AppDialog,
  AppText,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
} from '../../components/ui';
import {
  applyFormFailure,
  getUserFacingErrorMessage,
  logInfrastructureError,
  readFormFailure,
} from '../../errors';
import { getApiAssetUrl } from '../../lib/environment';
import {
  authKeys,
  canWritePrivateCache,
  categoryKeys,
  currentAuthEpoch,
  refreshPrivateQuery,
} from '../../lib/query-cache';
import { usePrivateCacheEpoch } from '../../lib/use-private-cache-epoch';
import { presentEnum, sellerStatusLabels } from '../../lib/presentation';
import { AccountLogoutButton } from '../auth/AccountLogoutButton';
import { useAccountLogout } from '../auth/account-logout';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';
import { AuthorApplicationAchievements } from './AuthorApplicationAchievements';
import { AuthorApplicationExitConfirm } from './author-application-exit-confirm';
import { AuthorDirectionsPickerSheet } from './author-directions-picker-sheet';
import { AuthorIntroDialog } from './AuthorIntroDialog';
import {
  sellerProfileQueryKey,
  profileFieldOrder,
  toFields,
  withSubmittedRevision,
  profileFieldsToUpdate,
  profileFieldsToCreate,
  useProfileData,
  type ProfileSaveVariables,
  type ProfileSaveResult,
} from './seller-profile-data';
import {
  emptyProfileDraft,
  profileDraftAllowsSave,
  profileDraftSchema,
} from './profile-validation';
import {
  canSubmitSellerProfileRevision,
  isSellerProfileFormEditable,
} from './seller-profile-editable';
import {
  ProfileFieldWriteGuard,
  ProfileRequirementScope,
  type ProfileRequirementControls,
  type ProfileFields,
} from './seller-profile-steps';
import {
  previousSellerProfileStep,
  resolveSellerProfileStep,
  shouldAdvanceSellerApplication,
  shouldSaveBeforeSellerProfileBack,
  shouldShowSellerProfileAchievements,
} from './seller-profile-wizard';
import { persistedFieldOverrides } from './reconcile-saved-fields';
import { SellerProfileApplicationSteps } from './seller-profile-application-steps';
import { SellerProfileCabinetForm } from './seller-profile-cabinet-form';

export function SellerProfileScreen() {
  const isFocused = useIsFocused();
  const focusedRef = useRef(isFocused);
  const focusTurn = useRef(0);
  if (focusedRef.current !== isFocused) {
    focusedRef.current = isFocused;
    focusTurn.current += 1;
  }
  const api = useApiClient();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { intro, step } = useLocalSearchParams<{
    intro?: string | string[];
    step?: string | string[];
  }>();
  const query = useProfileData();
  const profile = query.data?.sellerProfile;
  const editingRevision = query.data?.editingRevision;
  const form = useForm<ProfileFields>({
    defaultValues: emptyProfileDraft,
    resolver: zodResolver(profileDraftSchema),
    mode: 'onChange',
    shouldUnregister: false,
  });
  const [formAlert, setFormAlert] = useState<string | null>(null);
  const formAlertText = formAlert ? (
    <AppText role="bodySmall" tone="danger" accessibilityLiveRegion="polite">
      {formAlert}
    </AppText>
  ) : null;
  const [requirementEpoch, setRequirementEpoch] = useState(0);
  const requirementControls = useRef<ProfileRequirementControls>({
    reveal: () => undefined,
  });
  const reportProfileError = (
    error: unknown,
    surface: string,
    fallback = 'Не удалось сохранить профиль',
    operation = sessionOperation.current,
  ) => {
    if (!focusedRef.current || sessionOperation.current !== operation) return;
    logInfrastructureError(error, surface);
    const failure = readFormFailure(error, profileFieldOrder);
    if (failure.disposition === 'passthrough') {
      setFormAlert(getUserFacingErrorMessage(error, fallback));
      return;
    }
    applyFormFailure(form, failure, profileFieldOrder);
    setFormAlert(failure.formMessage);
  };
  const [slug, fullName, country, directionCategoryIds, shortDescription] =
    useWatch({
      control: form.control,
      name: [
        'slug',
        'fullName',
        'country',
        'directionCategoryIds',
        'shortDescription',
        'telegramUrl',
        'instagramUrl',
        'websiteUrl',
        'publicEmail',
        'socialLink',
      ],
    });
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [exitIntent, setExitIntent] = useState<'home' | 'logout' | 'back'>(
    'home',
  );
  const [achievementDraftDirty, setAchievementDraftDirty] = useState(false);
  const achievementDraftDirtyRef = useRef(false);
  const rememberAchievementDraft = useCallback(
    (epoch: number, dirty: boolean) => {
      if (!canWritePrivateCache(queryClient, epoch)) return;
      achievementDraftDirtyRef.current = dirty;
      setAchievementDraftDirty(dirty);
    },
    [queryClient],
  );
  const [directionsPickerOpen, setDirectionsPickerOpen] = useState(false);
  const [directionsRequirementRevealed, setDirectionsRequirementRevealed] =
    useState(false);
  const leaving = useRef(false);
  const saveInFlight = useRef(false);
  const logoutStarted = useRef(false);
  const revisionSubmitInFlight = useRef(false);
  const transitionLock = useRef(false);
  const photoSelection = useRef(0);
  const sessionOperation = useRef(0);
  const resetSaveMutation = useRef<() => void>(() => undefined);
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
  const sessionSlug = canWritePrivateCache(queryClient, authEpoch)
    ? queryClient.getQueryData<{ slug?: string | null }>(authKeys.session)?.slug
    : null;
  const seenAuthEpoch = useRef(authEpoch);
  const forceProfileHydration = useRef(false);
  const draftValidation = useRef({ epoch: 0, running: false });
  const missingProfile =
    query.isError &&
    query.error instanceof ApiClientError &&
    query.error.kind === 'not_found';
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
  const isApplicationWizard =
    !profile ||
    ['DRAFT', 'CHANGES_REQUESTED', 'REJECTED'].includes(profile.status);
  const profileStep = isApplicationWizard ? requestedStep : 1;
  const basicsStep = isApplicationWizard && profileStep === 1;
  const contactsStep = isApplicationWizard && profileStep === 2;
  const aboutStep = isApplicationWizard && profileStep === 3;
  const achievementsStep = isApplicationWizard && profileStep === 4;
  const categories = useQuery({
    queryKey: categoryKeys.all,
    queryFn: ({ signal }) => api.categories.list({ signal }),
    enabled: auth.isAuthenticated,
  });
  const directionLabels = useMemo(() => {
    const names = new Map(
      [
        ...(profile?.directions ?? []),
        ...(categories.data?.categories ?? []),
      ].map((direction) => [direction.id, direction.name]),
    );
    return (directionCategoryIds ?? []).flatMap((id) => {
      const name = names.get(id);
      return name ? [{ id, name }] : [];
    });
  }, [directionCategoryIds, profile?.directions, categories.data]);
  const directionsError =
    directionsRequirementRevealed && (directionCategoryIds?.length ?? 0) === 0
      ? 'Выберите хотя бы одно направление'
      : undefined;
  const editable = isSellerProfileFormEditable(profile, editingRevision);
  const canSubmitRevision = canSubmitSellerProfileRevision(
    profile,
    editingRevision,
  );
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
    if (profile || !sessionSlug || form.getValues('slug')) return;
    form.setValue('slug', sessionSlug, { shouldValidate: true });
  }, [sessionSlug, form, profile]);

  useEffect(() => {
    if (query.isLoading || !profile) return;
    const token = hydrationToken ?? null;
    const forced = forceProfileHydration.current;
    if (!token) return;
    if (hydratedProfileToken.current === token && !forced) return;
    if (!forced && form.formState.isDirty) return;
    forceProfileHydration.current = false;
    form.reset(toFields(profile));
    setRequirementEpoch((epoch) => epoch + 1);
    hydratedProfileToken.current = token;
    queueProfileDraftValidation();
  }, [
    form,
    form.formState.isDirty,
    hydrationToken,
    profile,
    query.isLoading,
    queueProfileDraftValidation,
  ]);

  useEffect(() => {
    if (!profile || photoBlob || !applicationPhoto.data) return;
    let cancelled = false;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (!cancelled && typeof reader.result === 'string') {
        setPhotoUri(reader.result);
        setPhotoFailed(false);
      }
    };
    reader.onerror = () => {
      if (!cancelled) setPhotoFailed(true);
    };
    reader.readAsDataURL(applicationPhoto.data);
    return () => {
      cancelled = true;
    };
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
    void queryClient.invalidateQueries({
      queryKey: ['seller', 'application-photo'],
    });
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
  const achievementWriteBlocksParent = () =>
    achievementWriteToken.current !== 0;
  const parentBlocksAchievement = () =>
    transitionLock.current ||
    revisionSubmitInFlight.current ||
    saveInFlight.current ||
    leaving.current ||
    logoutStarted.current ||
    accountLogout.busy;
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // The screen no longer owns pending saves, submissions or navigation.
      sessionOperation.current += 1;
    };
  }, []);
  useEffect(() => {
    if (seenAuthEpoch.current === authEpoch) return;
    seenAuthEpoch.current = authEpoch;
    sessionOperation.current += 1;
    photoSelection.current += 1;
    saveInFlight.current = false;
    resetSaveMutation.current();
    revisionSubmitInFlight.current = false;
    leaving.current = false;
    logoutStarted.current = false;
    endLockedTransition();
    setRevisionSubmitActive(false);
    parentOperationId.current += 1;
    achievementWriteToken.current = 0;
    setAchievementWriteActive(false);
    setFormAlert(null);
    achievementDraftDirtyRef.current = false;
    setAchievementDraftDirty(false);
    setDirectionsPickerOpen(false);
    setExitOpen(false);
    setDirectionsRequirementRevealed(false);
    setRequirementEpoch((epoch) => epoch + 1);
    photoBlobRef.current = null;
    setPhotoBlob(null);
    setPhotoUri(null);
    setPhotoFailed(false);
    // Read the installed session, not a possibly stale auth context during handoff.
    const sessionActive = canWritePrivateCache(queryClient, authEpoch);
    const cached = sessionActive
      ? queryClient.getQueryData<SellerProfileResponse>(sellerProfileQueryKey)
      : undefined;
    const cachedProfile = cached?.sellerProfile;
    if (cachedProfile) {
      form.reset(toFields(cachedProfile));
      hydratedProfileToken.current =
        cached.editingRevision?.updatedAt ?? cachedProfile.updatedAt ?? null;
      forceProfileHydration.current = false;
    } else {
      form.reset({ ...emptyProfileDraft, slug: sessionSlug ?? '' });
      hydratedProfileToken.current = null;
      forceProfileHydration.current = true;
    }
  }, [authEpoch, form, queryClient, sessionSlug]);
  const rememberSavedProfile = (
    saved: SellerProfileResponse,
    submitted: ProfileFields,
  ) => {
    const persisted = toFields(saved.sellerProfile);
    const overrides = persistedFieldOverrides(
      submitted,
      form.getValues(),
      persisted,
    );
    form.reset(persisted);
    setRequirementEpoch((epoch) => epoch + 1);
    for (const field of Object.keys(overrides) as Array<keyof ProfileFields>) {
      const value = overrides[field];
      if (value === undefined) continue;
      form.setValue(field, value, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
    queueProfileDraftValidation();
  };
  const sessionStillOwns = (operation: number, authEpoch: number) =>
    mountedRef.current &&
    sessionOperation.current === operation &&
    canWritePrivateCache(queryClient, authEpoch);
  const screenStillOwns = (operation: number, authEpoch: number) =>
    focusedRef.current && sessionStillOwns(operation, authEpoch);
  const saveMutation = useMutation({
    mutationFn: async (
      variables: ProfileSaveVariables,
    ): Promise<ProfileSaveResult> => {
      const current = queryClient.getQueryData<SellerProfileResponse>(
        sellerProfileQueryKey,
      );
      if (current?.sellerProfile) {
        return {
          outcome: 'saved',
          profile: await api.sellers.updateProfile(
            profileFieldsToUpdate(variables.fields),
            variables.photo ?? undefined,
          ),
        };
      }
      if (!variables.photo) throw new Error('Profile photo is required');
      if (!sessionStillOwns(variables.operation, variables.authEpoch)) {
        throw new Error('Session changed');
      }
      const installedSlug =
        queryClient.getQueryData<{ slug?: string | null }>(
          authKeys.session,
        )?.slug;
      if (!installedSlug) {
        const requested = variables.fields.slug.trim();
        const claimed = await api.auth.claimSlug({ slug: requested });
        if (!sessionStillOwns(variables.operation, variables.authEpoch)) {
          throw new Error('Session changed');
        }
        if (claimed.slug !== requested) {
          return { outcome: 'stored-slug', slug: claimed.slug };
        }
      }
      return {
        outcome: 'saved',
        profile: await api.sellers.createProfile(
          profileFieldsToCreate(variables.fields),
          variables.photo,
        ),
      };
    },
    onSuccess: (result, variables) => {
      if (result.outcome !== 'saved') return;
      // A completed write still belongs in the cache after the screen blurs.
      if (!sessionStillOwns(variables.operation, variables.authEpoch)) return;
      const saved = result.profile;
      rememberSavedProfile(saved, variables.fields);
      if (photoBlobRef.current === variables.photo) {
        photoBlobRef.current = null;
        setPhotoBlob(null);
      }
      queryClient.setQueryData(sellerProfileQueryKey, saved);
      hydratedProfileToken.current =
        saved.editingRevision?.updatedAt ?? saved.sellerProfile.updatedAt;
      invalidate();
    },
  });
  const advanceMutation = useMutation({
    mutationFn: async (owner: { epoch: number; operation: number }) => ({
      saved: await api.portfolio.advanceAuthorApplication(),
      ...owner,
    }),
    onSuccess: async ({ saved, epoch, operation }) => {
      if (!sessionStillOwns(operation, epoch)) return;
      // A profile refetch started by save must not rewind the confirmed stage.
      await queryClient.cancelQueries(
        { queryKey: sellerProfileQueryKey },
        { revert: false },
      );
      if (!sessionStillOwns(operation, epoch)) return;
      queryClient.setQueryData(
        sellerProfileQueryKey,
        (current: SellerProfileResponse | undefined) =>
          current
            ? {
                ...current,
                sellerProfile: {
                  ...current.sellerProfile,
                  applicationStage: saved.application.applicationStage,
                },
              }
            : current,
      );
      void refreshPrivateQuery(queryClient, ['seller', 'application'], epoch);
      void queryClient.invalidateQueries({ queryKey: sellerProfileQueryKey });
    },
  });
  const submitMutation = useMutation({
    mutationFn: () => api.portfolio.submitAuthorApplication(),
  });
  resetSaveMutation.current = () => saveMutation.reset();

  const save = async (source?: 'revision-submit' | 'transition') => {
    if (!focusedRef.current || achievementWriteBlocksParent()) return null;
    if (logoutStarted.current || saveInFlight.current) return null;
    if (revisionSubmitInFlight.current && source !== 'revision-submit')
      return null;
    if (transitionLock.current && source !== 'revision-submit') return null;
    const fields = form.getValues();
    if (!profileDraftAllowsSave(fields)) return null;
    if (source === 'transition' && !beginLockedTransition()) return null;
    const startedInFocus = focusTurn.current;
    bumpParentOperation();
    const operation = sessionOperation.current;
    const variables: ProfileSaveVariables = {
      fields,
      photo: photoBlobRef.current,
      authEpoch: currentAuthEpoch(queryClient),
      operation,
    };
    saveInFlight.current = true;
    setFormAlert(null);
    try {
      const saved = await saveMutation.mutateAsync(variables);
      if (
        !screenStillOwns(operation, variables.authEpoch) ||
        focusTurn.current !== startedInFocus
      )
        return null;
      if (saved.outcome === 'stored-slug') {
        form.setValue('slug', saved.slug, {
          shouldDirty: false,
          shouldValidate: true,
        });
        if (source === 'transition') endLockedTransition();
        return null;
      }
      setFormAlert(null);
      return saved.profile;
    } catch (error) {
      if (
        !screenStillOwns(operation, variables.authEpoch) ||
        focusTurn.current !== startedInFocus
      )
        return null;
      if (source === 'transition') endLockedTransition();
      throw error;
    } finally {
      if (sessionOperation.current === operation) {
        saveInFlight.current = false;
        if (source === 'transition' && focusTurn.current !== startedInFocus) {
          endLockedTransition();
        }
      }
    }
  };
  const submitRevision = async () => {
    if (achievementDraftDirtyRef.current) return;
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
    if (!profileDraftAllowsSave(form.getValues())) return;
    if (!beginLockedTransition()) return;
    const submitEpoch = currentAuthEpoch(queryClient);
    const operation = sessionOperation.current;
    const startedInFocus = focusTurn.current;
    revisionSubmitInFlight.current = true;
    setRevisionSubmitActive(true);
    const stillOwnsSubmit = () =>
      focusTurn.current === startedInFocus &&
      screenStillOwns(operation, submitEpoch);
    try {
      let saved;
      try {
        saved = await save('revision-submit');
      } catch (error) {
        reportProfileError(error, 'seller-profile-save', undefined, operation);
        return;
      }
      if (!saved || !stillOwnsSubmit()) return;
      const submitted = await submitMutation.mutateAsync();
      if (!sessionStillOwns(operation, submitEpoch)) return;
      await queryClient.cancelQueries(
        { queryKey: sellerProfileQueryKey },
        { revert: false },
      );
      if (!sessionStillOwns(operation, submitEpoch)) return;
      queryClient.setQueryData<SellerProfileResponse>(
        sellerProfileQueryKey,
        (current) => withSubmittedRevision(current, submitted),
      );
      hydratedProfileToken.current =
        submitted.editingRevision?.updatedAt ?? hydratedProfileToken.current;
      void queryClient.invalidateQueries({
        queryKey: ['seller', 'application-photo'],
      });
      void refreshPrivateQuery(
        queryClient,
        ['seller', 'application'],
        submitEpoch,
      );
      await queryClient.refetchQueries({ queryKey: sellerProfileQueryKey });
    } catch (error) {
      reportProfileError(
        error,
        'seller-profile-submit',
        'Не удалось отправить заявку',
        operation,
      );
    } finally {
      if (sessionOperation.current === operation) {
        revisionSubmitInFlight.current = false;
        setRevisionSubmitActive(false);
        endLockedTransition();
      }
    }
  };
  const continueFromStep = async (visibleStep: 1 | 2 | 3) => {
    if (transitionLock.current || achievementWriteBlocksParent()) return;
    const epoch = currentAuthEpoch(queryClient);
    const operation = sessionOperation.current;
    const startedInFocus = focusTurn.current;
    const stillOwnsStep = () =>
      focusTurn.current === startedInFocus && screenStillOwns(operation, epoch);
    try {
      const saved = await save('transition');
      if (!saved || !stillOwnsStep()) return;
      if (
        visibleStep !== 1 &&
        shouldAdvanceSellerApplication(saved.sellerProfile, visibleStep)
      ) {
        await advanceMutation.mutateAsync({ epoch, operation });
        if (!stillOwnsStep()) return;
      }
      router.push(`/profile?step=${visibleStep + 1}`);
    } catch (error) {
      reportProfileError(error, 'seller-profile-step', undefined, operation);
    } finally {
      if (sessionOperation.current === operation) endLockedTransition();
    }
  };
  const choosePhoto = async () => {
    if (!fieldsEditable || transitionLock.current) return;
    const epoch = currentAuthEpoch(queryClient);
    const operation = sessionOperation.current;
    const startedInFocus = focusTurn.current;
    const selection = photoSelection.current + 1;
    photoSelection.current = selection;
    const stillOwnsPhoto = () =>
      focusTurn.current === startedInFocus &&
      selection === photoSelection.current &&
      !transitionLock.current &&
      screenStillOwns(operation, epoch);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 1,
      });
      if (!stillOwnsPhoto()) return;
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const blob = await fetch(asset.uri).then((response) => response.blob());
      if (!stillOwnsPhoto()) return;
      photoBlobRef.current = blob;
      setPhotoUri(asset.uri);
      setPhotoFailed(false);
      setPhotoBlob(blob);
      setFormAlert(null);
    } catch (error) {
      if (stillOwnsPhoto()) {
        reportProfileError(
          error,
          'seller-profile-photo',
          'Не удалось выбрать фото',
          operation,
        );
      }
    }
  };
  const hasRequiredDetails = Boolean(
    slug.trim() && fullName.trim() && country.trim() && (profile || photoBlob),
  );
  const draftAllowsSave = profileDraftAllowsSave(form.getValues());
  const canSave = editable && draftAllowsSave;
  const pageStatus = infrastructurePageFetchStatus(query);
  const preview =
    photoUri ?? (profile ? getApiAssetUrl(profile.profilePhotoUrl) : null);
  const canPersistBeforeExit =
    canSave && (Boolean(profile) || hasRequiredDetails);
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
    const persistBeforeExit =
      editable &&
      profileDraftAllowsSave(form.getValues()) &&
      (Boolean(profile) || hasRequiredDetails);
    if (persistBeforeExit && (form.formState.isDirty || photoBlob)) {
      try {
        const saved = await save('transition');
        if (
          !saved ||
          sessionOperation.current !== operation ||
          !canWritePrivateCache(queryClient, epoch)
        ) {
          if (sessionOperation.current === operation) leaving.current = false;
          return;
        }
      } catch (error) {
        if (sessionOperation.current === operation) leaving.current = false;
        reportProfileError(error, 'seller-profile-exit', undefined, operation);
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
    if (exitIntent === 'back') {
      router.push(`/profile?step=${previousSellerProfileStep(profileStep)}`);
      setExitOpen(false);
      leaving.current = false;
    } else {
      router.replace('/');
    }
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
    if (achievementDraftDirtyRef.current) {
      setExitIntent('back');
      setExitOpen(true);
      return;
    }
    const operation = sessionOperation.current;
    const epoch = currentAuthEpoch(queryClient);
    if (
      shouldSaveBeforeSellerProfileBack(
        form.formState.isDirty,
        Boolean(photoBlob),
      )
    ) {
      if (!editable || !profileDraftAllowsSave(form.getValues())) return;
      try {
        const saved = await save('transition');
        if (
          !saved ||
          sessionOperation.current !== operation ||
          !canWritePrivateCache(queryClient, epoch)
        )
          return;
      } catch (error) {
        reportProfileError(error, 'seller-profile-step', undefined, operation);
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
    if (
      achievementWriteBlocksParent() ||
      transitionLock.current ||
      revisionSubmitInFlight.current ||
      saveInFlight.current ||
      leaving.current ||
      logoutStarted.current ||
      accountLogout.busy
    )
      return;
    if (
      !form.formState.isDirty &&
      !photoBlob &&
      !achievementDraftDirtyRef.current
    ) {
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
  const baseExitDescription = profile
    ? form.formState.isDirty || photoBlob
      ? 'Последние изменения ещё не сохранены. Сохранить их перед выходом?'
      : 'Ваш черновик сохранён. Вы сможете продолжить позже.'
    : exitDescription;
  const exitDescriptionText = achievementDraftDirty
    ? `Недобавленное событие будет потеряно. ${baseExitDescription}`
    : baseExitDescription;
  const exitDialog = isApplicationWizard ? (
    <AuthorApplicationExitConfirm
      open={exitOpen}
      copy={{
        title: 'Прервать регистрацию',
        description: exitDescriptionText,
      }}
      busy={
        saveMutation.isPending ||
        accountLogout.busy ||
        revisionSubmitActive ||
        achievementWriteActive ||
        inputsLocked
      }
      error={formAlert ?? undefined}
      onLeave={() => void exit()}
      onContinue={() => setExitOpen(false)}
    />
  ) : (
    <AppDialog
      open={exitOpen}
      title="Выйти из заявки?"
      description={exitDescriptionText}
      onClose={() => setExitOpen(false)}
    >
      <PrimaryButton
        label={
          canPersistBeforeExit ? 'Сохранить и выйти' : 'Выйти без сохранения'
        }
        loading={saveMutation.isPending || accountLogout.busy}
        disabled={revisionSubmitActive || achievementWriteActive}
        width="block"
        onPress={() => void exit()}
      />
      <SecondaryButton
        label="Продолжить заполнение"
        disabled={saveMutation.isPending || accountLogout.busy}
        width="block"
        onPress={() => setExitOpen(false)}
      />
    </AppDialog>
  );
  if (!missingProfile && pageStatus !== 'ready')
    return (
      <AppShell>
        <InfrastructurePageStatus
          status={pageStatus}
          onRetry={() => void query.refetch()}
        />
        <AccountLogoutButton
          width="content"
          pending={
            saveMutation.isPending || accountLogout.busy || revisionSubmitActive
          }
          onPress={() => requestExit('logout')}
        />
        {exitDialog}
      </AppShell>
    );

  const stepBusy = {
    savePending: saveMutation.isPending,
    accountBusy: accountLogout.busy,
    revisionSubmitActive,
    inputsLocked,
    achievementWriteActive,
  };
  const basicsAction = (
    <PrimaryButton
      loading={saveMutation.isPending}
      disabled={
        !canSave ||
        !hasRequiredDetails ||
        accountLogout.busy ||
        revisionSubmitActive ||
        inputsLocked ||
        achievementWriteActive
      }
      onPress={() => void continueFromStep(1)}
      label="Продолжить"
      size="auth"
      width="block"
    />
  );
  const contactsAction = (
    <PrimaryButton
      loading={saveMutation.isPending || advanceMutation.isPending}
      disabled={
        !canSave ||
        accountLogout.busy ||
        revisionSubmitActive ||
        inputsLocked ||
        achievementWriteActive
      }
      onPress={() => void continueFromStep(2)}
      label="Продолжить"
      size="auth"
      width="block"
    />
  );
  const aboutAction = (
    <PrimaryButton
      loading={saveMutation.isPending || advanceMutation.isPending}
      disabled={
        !canSave ||
        accountLogout.busy ||
        revisionSubmitActive ||
        inputsLocked ||
        achievementWriteActive
      }
      onPress={() => {
        const missing: Array<'shortDescription'> = [];
        if (!shortDescription.trim()) missing.push('shortDescription');
        if ((directionCategoryIds?.length ?? 0) === 0) {
          setDirectionsRequirementRevealed(true);
        }
        if (missing.length > 0) {
          requirementControls.current.reveal(missing);
          return;
        }
        if ((directionCategoryIds?.length ?? 0) === 0) return;
        void continueFromStep(3);
      }}
      label="Продолжить"
      size="auth"
      width="block"
    />
  );
  const achievements = (
    <AuthorApplicationAchievements
      editable={fieldsEditable}
      parentBusy={parentBlocksAchievement}
      parentOperation={currentParentOperation}
      onChildWrite={setAchievementWrite}
      onDraftChange={rememberAchievementDraft}
    />
  );
  const achievementsVisible = shouldShowSellerProfileAchievements(
    Boolean(profile),
    isApplicationWizard,
    profileStep,
  );
  const wizardStep = isApplicationWizard
    ? basicsStep
      ? ('basics' as const)
      : contactsStep
        ? ('contacts' as const)
        : aboutStep
          ? ('about' as const)
          : achievementsStep
            ? ('achievements' as const)
            : null
    : null;
  const slugEditable = fieldsEditable && !profile && !sessionSlug;
  const stepPhoto = {
    uri: preview,
    local: photoBlob !== null,
    failed: photoFailed,
    disabled: !fieldsEditable,
    onChoose: () => void choosePhoto(),
    onFailed: () => setPhotoFailed(true),
  };
  const removeDirection = (id: string) => {
    if (!fieldsEditable || transitionLock.current) return;
    form.setValue(
      'directionCategoryIds',
      directionCategoryIds.filter((value) => value !== id),
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      },
    );
    setDirectionsRequirementRevealed(true);
  };
  const openDirectionsPicker = () => {
    if (fieldsEditable) setDirectionsPickerOpen(true);
  };
  const requestSave = () => {
    const operation = sessionOperation.current;
    void save().catch((error) =>
      reportProfileError(error, 'seller-profile-save', undefined, operation),
    );
  };
  const wizardSubmitDisabled =
    revisionSubmitActive ||
    saveMutation.isPending ||
    submitMutation.isPending ||
    !canSave ||
    accountLogout.busy ||
    inputsLocked ||
    achievementWriteActive ||
    achievementDraftDirty;
  const cabinetSubmitDisabled =
    revisionSubmitActive ||
    saveMutation.isPending ||
    submitMutation.isPending ||
    !canSave ||
    accountLogout.busy ||
    inputsLocked ||
    achievementWriteActive;

  return (
    <View style={{ flex: 1, display: isFocused ? 'flex' : 'none' }}>
      <FormProvider {...form}>
        <ProfileRequirementScope
          epoch={requirementEpoch}
          controls={requirementControls}
        >
          <ProfileFieldWriteGuard guard={transitionLock}>
            <FormPageShell
              hideDock={isApplicationWizard}
              variant={isApplicationWizard ? 'authorApplication' : 'default'}
            >
              <View style={{ gap: designTokens.space.x5 }}>
                {wizardStep !== null ? null : (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: designTokens.space.x3,
                    }}
                  >
                    <View style={{ flex: 1, gap: designTokens.space.x2 }}>
                      <PageHeader
                        title="Профиль автора"
                        description={
                          !profile
                            ? 'Заполните профиль и сохраните черновик до отправки на модерацию.'
                            : undefined
                        }
                      />
                      {profile ? (
                        <AppText
                          role="caption"
                          tone={
                            profile.status === 'APPROVED'
                              ? 'success'
                              : profile.status === 'REJECTED'
                                ? 'danger'
                                : 'secondary'
                          }
                        >
                          {presentEnum(
                            profile.status,
                            sellerStatusLabels,
                            'Неизвестный статус',
                          )}
                        </AppText>
                      ) : null}
                    </View>
                    {introOpen ? null : (
                      <AccountLogoutButton
                        width="content"
                        pending={
                          saveMutation.isPending ||
                          accountLogout.busy ||
                          revisionSubmitActive
                        }
                        onPress={() => requestExit('logout')}
                      />
                    )}
                    {isApplicationWizard ? (
                      <SecondaryButton
                        label="Закрыть"
                        disabled={
                          revisionSubmitActive ||
                          inputsLocked ||
                          achievementWriteActive
                        }
                        onPress={() => requestExit('home')}
                      />
                    ) : null}
                  </View>
                )}
                <MediaDeliveryNotice delivery={query.data?.publication} />
                {editingRevision?.status === 'PENDING_REVIEW' ? (
                  <AppText role="bodySmall" tone="secondary">
                    Заявка на проверке
                  </AppText>
                ) : null}
                <SellerProfileApplicationSteps
                  step={wizardStep}
                  busy={stepBusy}
                  introOpen={introOpen}
                  requestExit={requestExit}
                  goToPreviousStep={() => void goToPreviousStep()}
                  fieldsEditable={fieldsEditable}
                  slugEditable={slugEditable}
                  photo={stepPhoto}
                  formAlert={formAlertText}
                  basicsAction={basicsAction}
                  contactsAction={contactsAction}
                  aboutAction={aboutAction}
                  directionLabels={directionLabels}
                  directionsError={directionsError}
                  onRemoveDirection={removeDirection}
                  onOpenDirections={openDirectionsPicker}
                  achievements={achievements}
                  achievementsVisible={achievementsVisible}
                  editable={editable}
                  canSubmitRevision={canSubmitRevision}
                  submitPending={submitMutation.isPending || revisionSubmitActive}
                  submitDisabled={wizardSubmitDisabled}
                  onSubmit={() => void submitRevision()}
                  achievementDraftDirty={achievementDraftDirty}
                />
                {!isApplicationWizard ? (
                  <SellerProfileCabinetForm
                    photo={stepPhoto}
                    fieldsEditable={fieldsEditable}
                    slugEditable={slugEditable}
                    profileStep={profileStep}
                    directionLabels={directionLabels}
                    directionsError={directionsError}
                    onOpenDirections={openDirectionsPicker}
                    editable={editable}
                    revisionPending={editingRevision?.status === 'PENDING_REVIEW'}
                    achievements={achievements}
                    achievementsVisible={achievementsVisible}
                    savePending={saveMutation.isPending || revisionSubmitActive}
                    saveDisabled={
                      !canSave ||
                      accountLogout.busy ||
                      revisionSubmitActive ||
                      inputsLocked ||
                      achievementWriteActive
                    }
                    onSave={requestSave}
                    canSubmitRevision={canSubmitRevision}
                    submitPending={submitMutation.isPending || revisionSubmitActive}
                    submitDisabled={cabinetSubmitDisabled}
                    onSubmit={() => void submitRevision()}
                    showCreate={profile?.status === 'APPROVED'}
                  />
                ) : null}
                {wizardStep === null ? formAlertText : null}
                <AuthorDirectionsPickerSheet
                  open={directionsPickerOpen}
                  disabled={!fieldsEditable}
                  selectedIds={directionCategoryIds ?? []}
                  knownDirections={profile?.directions ?? []}
                  onClose={() => setDirectionsPickerOpen(false)}
                  onApply={(ids) => {
                    if (!fieldsEditable || transitionLock.current) return;
                    form.setValue('directionCategoryIds', ids, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    });
                    if (ids.length > 0) setDirectionsRequirementRevealed(false);
                  }}
                />
                <AuthorIntroDialog
                  open={introOpen}
                  onStart={() => router.replace('/profile?step=1')}
                  onClose={() => router.replace('/profile')}
                />
                {exitDialog}
              </View>
            </FormPageShell>
          </ProfileFieldWriteGuard>
        </ProfileRequirementScope>
      </FormProvider>
    </View>
  );
}
