import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FormProvider, useWatch } from 'react-hook-form';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { ApiClientError } from '@bidplace/api-client';
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
  authKeys,
  canWritePrivateCache,
  categoryKeys,
  currentAuthEpoch,
} from '../../lib/query-cache';
import { presentEnum, sellerStatusLabels } from '../../lib/presentation';
import { AccountLogoutButton } from '../auth/AccountLogoutButton';
import { useAccountLogout } from '../auth/account-logout';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';
import { AuthorApplicationAchievements } from './AuthorApplicationAchievements';
import { AuthorApplicationExitConfirm } from './author-application-exit-confirm';
import { AuthorDirectionsPickerSheet } from './author-directions-picker-sheet';
import { AuthorIntroDialog } from './AuthorIntroDialog';
import { useProfileData, toFields } from './seller-profile-data';
import {
  profileDraftAllowsSave,
  profileDraftFieldsSchema,
} from './profile-validation';
import { useLocalFormRestore } from './local-form-restore';
import {
  canSubmitSellerProfileRevision,
  isSellerProfileFormEditable,
} from './seller-profile-editable';
import {
  ProfileFieldWriteGuard,
  ProfileRequirementScope,
} from './seller-profile-steps';
import {
  createSellerProfileHref,
  previousSellerProfileStep,
  resolveSellerProfileStep,
  shouldSaveBeforeSellerProfileBack,
  shouldShowSellerProfileAchievements,
} from './seller-profile-wizard';
import { useProfileOperationGuard } from './seller-profile-operation-guard';
import { useSellerProfileForm } from './seller-profile-form';
import { useProfilePhoto } from './seller-profile-photo';
import { useProfileDirections } from './seller-profile-directions';
import { useProfileSubmission } from './seller-profile-submission';
import { SellerProfileApplicationSteps } from './seller-profile-application-steps';
import { SellerProfileCabinetForm } from './seller-profile-cabinet-form';

export function SellerProfileScreen() {
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
  const guard = useProfileOperationGuard(queryClient);
  const { authEpoch, isFocused } = guard;
  const accountLogout = useAccountLogout();
  const sessionSlug = canWritePrivateCache(queryClient, authEpoch)
    ? (queryClient.getQueryData<{ slug?: string | null }>(authKeys.session)
        ?.slug ?? null)
    : null;
  const hydrationToken = editingRevision?.updatedAt ?? profile?.updatedAt;
  const profileForm = useSellerProfileForm({
    queryClient,
    guard,
    sessionSlug,
    profile,
    isProfileLoading: query.isLoading,
    hydrationToken,
  });
  const { form } = profileForm;
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
  const leaving = useRef(false);
  const logoutStarted = useRef(false);
  const achievementWriteToken = useRef(0);
  const [achievementWriteActive, setAchievementWriteActive] = useState(false);
  const [achievementStorageError, setAchievementStorageError] = useState<
    string | null
  >(null);
  const seenAuthEpoch = useRef(authEpoch);
  const missingProfile =
    query.isError &&
    query.error instanceof ApiClientError &&
    query.error.kind === 'not_found';
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
  const editable = isSellerProfileFormEditable(profile, editingRevision);
  const canSubmitRevision = canSubmitSellerProfileRevision(
    profile,
    editingRevision,
  );
  const fieldsEditable = editable && !guard.inputsLocked;
  guard.noteFieldsEditable(fieldsEditable);
  const directions = useProfileDirections({
    knownDirections: profile?.directions,
    categories: categories.data?.categories,
    directionCategoryIds,
    fieldsEditable,
    transitionLock: guard.transitionLock,
    setDirectionIds: (ids) =>
      form.setValue('directionCategoryIds', ids, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      }),
    guard,
  });
  const photo = useProfilePhoto({
    api,
    queryClient,
    guard,
    profile,
    hydrationToken,
    fieldsEditable,
    reportError: profileForm.reportError,
    clearAlert: () => profileForm.setFormAlert(null),
  });
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
  const accountId = canWritePrivateCache(queryClient, authEpoch)
    ? (auth.user?.id ?? null)
    : null;
  const restore = useLocalFormRestore({
    form,
    accountId,
    scope: 'seller-application',
    entityId: profile?.id ?? 'new',
    baseToken: hydrationToken ?? null,
    serverValues: profile ? toFields(profile) : null,
    fields: profileDraftFieldsSchema,
    canWrite: () => canWritePrivateCache(queryClient, authEpoch),
  });
  const submission = useProfileSubmission({
    api,
    queryClient,
    guard,
    profileForm,
    photo,
    achievementGate: {
      draftDirty: () => achievementDraftDirtyRef.current,
      writeBlocksParent: achievementWriteBlocksParent,
    },
    exitGate: {
      logoutStarted: () => logoutStarted.current,
      busy: () =>
        leaving.current || logoutStarted.current || accountLogout.busy,
    },
    onSubmitted: () => restore.clearDraft(),
    onCreated: (saved) =>
      restore.noteEntityCreated(
        saved.sellerProfile.id,
        saved.editingRevision?.updatedAt ?? saved.sellerProfile.updatedAt,
      ),
  });
  const parentBlocksAchievement = () =>
    guard.transitionLock.current ||
    submission.revisionSubmitInFlight.current ||
    submission.saveInFlight.current ||
    leaving.current ||
    logoutStarted.current ||
    accountLogout.busy;

  useEffect(() => {
    if (seenAuthEpoch.current === authEpoch) return;
    seenAuthEpoch.current = authEpoch;
    leaving.current = false;
    logoutStarted.current = false;
    setExitOpen(false);
    achievementWriteToken.current = 0;
    setAchievementWriteActive(false);
    achievementDraftDirtyRef.current = false;
    setAchievementDraftDirty(false);
  }, [authEpoch]);

  useEffect(() => {
    if (typeof step === 'string' && String(requestedStep) !== step) {
      router.setParams({ step: String(requestedStep) });
    }
  }, [requestedStep, router, step]);

  useEffect(() => {
    if (profile && intro === '1') router.setParams({ intro: undefined });
  }, [intro, profile, router]);

  const hasRequiredDetails = Boolean(
    slug.trim() &&
    fullName.trim() &&
    country.trim() &&
    (profile || photo.photoBlob),
  );
  const draftAllowsSave = profileDraftAllowsSave(form.getValues());
  const canSave = editable && draftAllowsSave;
  const pageStatus = infrastructurePageFetchStatus(query);
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
      submission.revisionSubmitInFlight.current ||
      submission.saveInFlight.current ||
      guard.transitionLock.current
    ) {
      return;
    }
    if (leaving.current || logoutStarted.current || accountLogout.busy) return;
    leaving.current = true;
    guard.bumpParentOperation();
    const operation = guard.currentOperation();
    const epoch = currentAuthEpoch(queryClient);
    const persistBeforeExit =
      editable &&
      profileDraftAllowsSave(form.getValues()) &&
      (Boolean(profile) || hasRequiredDetails);
    if (persistBeforeExit && (form.formState.isDirty || photo.photoBlob)) {
      try {
        const saved = await submission.save('transition');
        if (
          !saved ||
          guard.currentOperation() !== operation ||
          !canWritePrivateCache(queryClient, epoch)
        ) {
          if (guard.currentOperation() === operation) leaving.current = false;
          return;
        }
      } catch (error) {
        if (guard.currentOperation() === operation) leaving.current = false;
        profileForm.reportError(
          error,
          'seller-profile-exit',
          undefined,
          operation,
        );
        return;
      }
    }
    if (guard.currentOperation() !== operation) return;
    guard.endLockedTransition();
    if (exitIntent === 'logout') {
      logoutStarted.current = true;
      await accountLogout.logout();
      return;
    }
    if (exitIntent === 'back') {
      router.push(
        createSellerProfileHref(previousSellerProfileStep(profileStep)),
      );
      setExitOpen(false);
      leaving.current = false;
    } else {
      router.replace('/');
    }
  };
  const goToPreviousStep = async () => {
    if (
      achievementWriteBlocksParent() ||
      guard.transitionLock.current ||
      submission.revisionSubmitInFlight.current ||
      profileStep <= 1
    ) {
      return;
    }
    if (achievementDraftDirtyRef.current) {
      setExitIntent('back');
      setExitOpen(true);
      return;
    }
    const operation = guard.currentOperation();
    const epoch = currentAuthEpoch(queryClient);
    if (
      shouldSaveBeforeSellerProfileBack(
        form.formState.isDirty,
        Boolean(photo.photoBlob),
      )
    ) {
      if (!editable || !profileDraftAllowsSave(form.getValues())) return;
      try {
        const saved = await submission.save('transition');
        if (
          !saved ||
          guard.currentOperation() !== operation ||
          !canWritePrivateCache(queryClient, epoch)
        )
          return;
      } catch (error) {
        profileForm.reportError(
          error,
          'seller-profile-step',
          undefined,
          operation,
        );
        return;
      }
      if (guard.currentOperation() !== operation) return;
      router.push(
        createSellerProfileHref(previousSellerProfileStep(profileStep)),
      );
      guard.endLockedTransition();
      return;
    }
    if (!guard.beginLockedTransition()) return;
    if (guard.currentOperation() !== operation) return;
    router.push(
      createSellerProfileHref(previousSellerProfileStep(profileStep)),
    );
    guard.releaseTransitionAfterTurn(operation);
  };
  const requestExit = (intent: 'home' | 'logout') => {
    if (
      achievementWriteBlocksParent() ||
      guard.transitionLock.current ||
      submission.revisionSubmitInFlight.current ||
      submission.saveInFlight.current ||
      leaving.current ||
      logoutStarted.current ||
      accountLogout.busy
    )
      return;
    if (
      !form.formState.isDirty &&
      !photo.photoBlob &&
      !achievementDraftDirtyRef.current
    ) {
      if (intent === 'logout') {
        logoutStarted.current = true;
        guard.bumpParentOperation();
        void accountLogout.logout();
        return;
      }
      const operation = guard.currentOperation();
      if (!guard.beginLockedTransition()) return;
      router.replace('/');
      guard.releaseTransitionAfterTurn(operation);
      return;
    }
    setExitIntent(intent);
    setExitOpen(true);
  };
  const introOpen = intro === '1' && missingProfile;
  const baseExitDescription = profile
    ? form.formState.isDirty || photo.photoBlob
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
        submission.saveMutation.isPending ||
        accountLogout.busy ||
        submission.revisionSubmitActive ||
        achievementWriteActive ||
        guard.inputsLocked
      }
      error={profileForm.formAlert ?? undefined}
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
        loading={submission.saveMutation.isPending || accountLogout.busy}
        disabled={submission.revisionSubmitActive || achievementWriteActive}
        width="block"
        onPress={() => void exit()}
      />
      <SecondaryButton
        label="Продолжить заполнение"
        disabled={submission.saveMutation.isPending || accountLogout.busy}
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
            submission.saveMutation.isPending ||
            accountLogout.busy ||
            submission.revisionSubmitActive
          }
          onPress={() => requestExit('logout')}
        />
        {exitDialog}
      </AppShell>
    );

  const stepBusy = {
    savePending: submission.saveMutation.isPending,
    accountBusy: accountLogout.busy,
    revisionSubmitActive: submission.revisionSubmitActive,
    inputsLocked: guard.inputsLocked,
    achievementWriteActive,
  };
  const basicsAction = (
    <PrimaryButton
      loading={submission.saveMutation.isPending}
      disabled={
        !canSave ||
        !hasRequiredDetails ||
        accountLogout.busy ||
        submission.revisionSubmitActive ||
        guard.inputsLocked ||
        achievementWriteActive
      }
      onPress={() => void submission.continueFromStep(1)}
      label="Продолжить"
      size="auth"
      width="block"
    />
  );
  const contactsAction = (
    <PrimaryButton
      loading={
        submission.saveMutation.isPending ||
        submission.advanceMutation.isPending
      }
      disabled={
        !canSave ||
        accountLogout.busy ||
        submission.revisionSubmitActive ||
        guard.inputsLocked ||
        achievementWriteActive
      }
      onPress={() => void submission.continueFromStep(2)}
      label="Продолжить"
      size="auth"
      width="block"
    />
  );
  const aboutAction = (
    <PrimaryButton
      loading={
        submission.saveMutation.isPending ||
        submission.advanceMutation.isPending
      }
      disabled={
        !canSave ||
        accountLogout.busy ||
        submission.revisionSubmitActive ||
        guard.inputsLocked ||
        achievementWriteActive
      }
      onPress={() => {
        const missing: Array<'shortDescription'> = [];
        if (!shortDescription.trim()) missing.push('shortDescription');
        if ((directionCategoryIds?.length ?? 0) === 0) {
          directions.revealRequirement();
        }
        if (missing.length > 0) {
          profileForm.requirementControls.current.reveal(missing);
          return;
        }
        if ((directionCategoryIds?.length ?? 0) === 0) return;
        void submission.continueFromStep(3);
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
      parentOperation={guard.currentParentOperation}
      onChildWrite={setAchievementWrite}
      onDraftChange={rememberAchievementDraft}
      onStorageError={setAchievementStorageError}
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
    uri: photo.preview,
    local: photo.photoBlob !== null,
    failed: photo.photoFailed,
    disabled: !fieldsEditable,
    onChoose: () => void photo.choosePhoto(),
    onFailed: () => photo.setPhotoFailed(true),
  };
  const requestSave = () => {
    const operation = guard.currentOperation();
    void submission
      .save()
      .catch((error) =>
        profileForm.reportError(
          error,
          'seller-profile-save',
          undefined,
          operation,
        ),
      );
  };
  const submitDisabled =
    submission.revisionSubmitActive ||
    submission.saveMutation.isPending ||
    submission.submitMutation.isPending ||
    !canSave ||
    accountLogout.busy ||
    guard.inputsLocked ||
    achievementWriteActive;
  const wizardSubmitDisabled = submitDisabled || achievementDraftDirty;

  return (
    <View style={{ flex: 1, display: isFocused ? 'flex' : 'none' }}>
      <FormProvider {...form}>
        <ProfileRequirementScope
          epoch={profileForm.requirementEpoch}
          controls={profileForm.requirementControls}
        >
          <ProfileFieldWriteGuard guard={guard.transitionLock}>
            <FormPageShell
              hideDock={isApplicationWizard}
              variant={isApplicationWizard ? 'authorApplication' : 'default'}
            >
              <View style={{ gap: designTokens.space.x5 }}>
                {(restore.storageError ?? achievementStorageError) ? (
                  <AppText role="bodySmall" tone="danger">
                    {restore.storageError ?? achievementStorageError}
                  </AppText>
                ) : null}
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
                          submission.saveMutation.isPending ||
                          accountLogout.busy ||
                          submission.revisionSubmitActive
                        }
                        onPress={() => requestExit('logout')}
                      />
                    )}
                    {isApplicationWizard ? (
                      <SecondaryButton
                        label="Закрыть"
                        disabled={
                          submission.revisionSubmitActive ||
                          guard.inputsLocked ||
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
                  formAlert={profileForm.formAlertText}
                  basicsAction={basicsAction}
                  contactsAction={contactsAction}
                  aboutAction={aboutAction}
                  directionLabels={directions.directionLabels}
                  directionsError={directions.directionsError}
                  onRemoveDirection={directions.removeDirection}
                  onOpenDirections={directions.openDirectionsPicker}
                  achievements={achievements}
                  achievementsVisible={achievementsVisible}
                  editable={editable}
                  canSubmitRevision={canSubmitRevision}
                  submitPending={
                    submission.submitMutation.isPending ||
                    submission.revisionSubmitActive
                  }
                  submitDisabled={wizardSubmitDisabled}
                  onSubmit={() => void submission.submitRevision()}
                  achievementDraftDirty={achievementDraftDirty}
                />
                {!isApplicationWizard ? (
                  <SellerProfileCabinetForm
                    photo={stepPhoto}
                    fieldsEditable={fieldsEditable}
                    slugEditable={slugEditable}
                    profileStep={profileStep}
                    directionLabels={directions.directionLabels}
                    directionsError={directions.directionsError}
                    onOpenDirections={directions.openDirectionsPicker}
                    editable={editable}
                    achievements={achievements}
                    achievementsVisible={achievementsVisible}
                    savePending={
                      submission.saveMutation.isPending ||
                      submission.revisionSubmitActive
                    }
                    saveDisabled={
                      !canSave ||
                      accountLogout.busy ||
                      submission.revisionSubmitActive ||
                      guard.inputsLocked ||
                      achievementWriteActive
                    }
                    onSave={requestSave}
                    canSubmitRevision={canSubmitRevision}
                    submitPending={
                      submission.submitMutation.isPending ||
                      submission.revisionSubmitActive
                    }
                    submitDisabled={submitDisabled}
                    onSubmit={() => void submission.submitRevision()}
                    showCreate={profile?.status === 'APPROVED'}
                  />
                ) : null}
                {!editable ? (
                  <AppText role="bodySmall" tone="secondary">
                    {editingRevision?.status === 'PENDING_REVIEW'
                      ? 'Заявка на проверке. Редактирование откроется, если модератор запросит правки.'
                      : 'Сейчас профиль нельзя редактировать.'}
                  </AppText>
                ) : null}
                {wizardStep === null ? profileForm.formAlertText : null}
                <AuthorDirectionsPickerSheet
                  open={directions.directionsPickerOpen}
                  disabled={!fieldsEditable}
                  selectedIds={directionCategoryIds ?? []}
                  knownDirections={profile?.directions ?? []}
                  onClose={() => directions.setDirectionsPickerOpen(false)}
                  onApply={directions.applyDirections}
                />
                <AuthorIntroDialog
                  open={introOpen}
                  onStart={() => router.replace(createSellerProfileHref(1))}
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
