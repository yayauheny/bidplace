import { useEffect, useRef, useState } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import type { SellerProfileResponse } from '@bidplace/contracts';

import {
  authKeys,
  canWritePrivateCache,
  currentAuthEpoch,
  refreshPrivateQuery,
} from '../../lib/query-cache';
import type { useApiClient } from '../../providers/api-provider';
import {
  sellerProfileQueryKey,
  profileFieldsToUpdate,
  profileFieldsToCreate,
  withSubmittedRevision,
  type ProfileSaveVariables,
  type ProfileSaveResult,
} from './seller-profile-data';
import { profileDraftAllowsSave } from './profile-validation';
import {
  createSellerProfileHref,
  shouldAdvanceSellerApplication,
} from './seller-profile-wizard';
import type { ProfileOperationGuard } from './seller-profile-operation-guard';
import type { SellerProfileForm } from './seller-profile-form';
import type { ProfilePhoto } from './seller-profile-photo';

/**
 * Owns the profile write pipeline: save (create/update/claim-slug), revision
 * submit and wizard step advance, with their single-flight locks.
 */
export function useProfileSubmission({
  api,
  queryClient,
  guard,
  profileForm,
  photo,
  achievementGate,
  exitGate,
  onSubmitted,
  onCreated,
}: {
  api: ReturnType<typeof useApiClient>;
  queryClient: QueryClient;
  guard: ProfileOperationGuard;
  profileForm: SellerProfileForm;
  photo: ProfilePhoto;
  achievementGate: {
    draftDirty: () => boolean;
    writeBlocksParent: () => boolean;
  };
  exitGate: {
    logoutStarted: () => boolean;
    busy: () => boolean;
  };
  onSubmitted?: () => void;
  onCreated?: (saved: SellerProfileResponse) => void;
}) {
  const router = useRouter();
  const { form, reportError, rememberSaved } = profileForm;
  const saveInFlight = useRef(false);
  const revisionSubmitInFlight = useRef(false);
  const [revisionSubmitActive, setRevisionSubmitActive] = useState(false);
  const seenAuthEpoch = useRef(guard.authEpoch);

  const invalidate = () => {
    if (!canWritePrivateCache(queryClient)) return;
    const epoch = currentAuthEpoch(queryClient);
    void queryClient.invalidateQueries({ queryKey: sellerProfileQueryKey });
    void queryClient.invalidateQueries({
      queryKey: ['seller', 'application-photo'],
    });
    void refreshPrivateQuery(queryClient, ['seller', 'application'], epoch);
  };

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
      if (!guard.sessionStillOwns(variables.operation, variables.authEpoch)) {
        throw new Error('Session changed');
      }
      const installedSlug = queryClient.getQueryData<{ slug?: string | null }>(
        authKeys.session,
      )?.slug;
      if (!installedSlug) {
        const requested = variables.fields.slug.trim();
        const claimed = await api.auth.claimSlug({ slug: requested });
        if (!guard.sessionStillOwns(variables.operation, variables.authEpoch)) {
          throw new Error('Session changed');
        }
        if (claimed.slug !== requested) {
          return { outcome: 'stored-slug', slug: claimed.slug };
        }
      }
      return {
        outcome: 'saved',
        created: true,
        profile: await api.sellers.createProfile(
          profileFieldsToCreate(variables.fields),
          variables.photo,
        ),
      };
    },
    onSuccess: (result, variables) => {
      if (result.outcome !== 'saved') return;
      // A completed write still belongs in the cache after the screen blurs.
      if (!guard.sessionStillOwns(variables.operation, variables.authEpoch))
        return;
      const saved = result.profile;
      rememberSaved(saved, variables.fields);
      photo.clearIfCurrent(variables.photo);
      queryClient.setQueryData(sellerProfileQueryKey, saved);
      if (result.created) {
        // Migrate the pre-creation local draft off the 'new' key so a later
        // visit cannot apply the stale empty snapshot over server values.
        onCreated?.(saved);
      }
      invalidate();
    },
  });

  const advanceMutation = useMutation({
    mutationFn: async (owner: { epoch: number; operation: number }) => ({
      saved: await api.portfolio.advanceAuthorApplication(),
      ...owner,
    }),
    onSuccess: async ({ saved, epoch, operation }) => {
      if (!guard.sessionStillOwns(operation, epoch)) return;
      // A profile refetch started by save must not rewind the confirmed stage.
      await queryClient.cancelQueries(
        { queryKey: sellerProfileQueryKey },
        { revert: false },
      );
      if (!guard.sessionStillOwns(operation, epoch)) return;
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

  useEffect(() => {
    if (seenAuthEpoch.current === guard.authEpoch) return;
    seenAuthEpoch.current = guard.authEpoch;
    saveInFlight.current = false;
    saveMutation.reset();
    revisionSubmitInFlight.current = false;
    setRevisionSubmitActive(false);
  }, [guard.authEpoch, saveMutation]);

  const save = async (source?: 'revision-submit' | 'transition') => {
    if (!guard.isScreenFocused() || achievementGate.writeBlocksParent())
      return null;
    if (exitGate.logoutStarted() || saveInFlight.current) return null;
    if (revisionSubmitInFlight.current && source !== 'revision-submit')
      return null;
    if (guard.transitionLock.current && source !== 'revision-submit')
      return null;
    const fields = form.getValues();
    if (!profileDraftAllowsSave(fields)) return null;
    if (source === 'transition' && !guard.beginLockedTransition()) return null;
    const attempt = guard.captureAttempt();
    guard.bumpParentOperation();
    const variables: ProfileSaveVariables = {
      fields,
      photo: photo.photoBlobRef.current,
      authEpoch: attempt.epoch,
      operation: attempt.operation,
    };
    saveInFlight.current = true;
    profileForm.setFormAlert(null);
    try {
      const saved = await saveMutation.mutateAsync(variables);
      if (!attempt.stillOwnsScreen()) return null;
      if (saved.outcome === 'stored-slug') {
        form.setValue('slug', saved.slug, {
          shouldDirty: false,
          shouldValidate: true,
        });
        if (source === 'transition') guard.endLockedTransition();
        return null;
      }
      profileForm.setFormAlert(null);
      return saved.profile;
    } catch (error) {
      if (!attempt.stillOwnsScreen()) return null;
      if (source === 'transition') guard.endLockedTransition();
      throw error;
    } finally {
      if (guard.currentOperation() === attempt.operation) {
        saveInFlight.current = false;
        if (
          source === 'transition' &&
          guard.focusTurn.current !== attempt.startedInFocus
        ) {
          guard.endLockedTransition();
        }
      }
    }
  };

  const submitRevision = async () => {
    if (achievementGate.draftDirty()) return;
    if (
      achievementGate.writeBlocksParent() ||
      revisionSubmitInFlight.current ||
      exitGate.busy() ||
      saveInFlight.current ||
      guard.transitionLock.current
    ) {
      return;
    }
    if (!profileDraftAllowsSave(form.getValues())) return;
    if (!guard.beginLockedTransition()) return;
    const submitEpoch = currentAuthEpoch(queryClient);
    const operation = guard.currentOperation();
    const startedInFocus = guard.focusTurn.current;
    revisionSubmitInFlight.current = true;
    setRevisionSubmitActive(true);
    const stillOwnsSubmit = () =>
      guard.focusTurn.current === startedInFocus &&
      guard.screenStillOwns(operation, submitEpoch);
    try {
      let saved;
      try {
        saved = await save('revision-submit');
      } catch (error) {
        reportError(error, 'seller-profile-save', undefined, operation);
        return;
      }
      if (!saved || !stillOwnsSubmit()) return;
      const submitted = await submitMutation.mutateAsync();
      if (!guard.sessionStillOwns(operation, submitEpoch)) return;
      await queryClient.cancelQueries(
        { queryKey: sellerProfileQueryKey },
        { revert: false },
      );
      if (!guard.sessionStillOwns(operation, submitEpoch)) return;
      queryClient.setQueryData<SellerProfileResponse>(
        sellerProfileQueryKey,
        (current) => withSubmittedRevision(current, submitted),
      );
      if (submitted.editingRevision) {
        profileForm.noteHydratedToken(submitted.editingRevision.updatedAt);
      }
      onSubmitted?.();
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
      reportError(
        error,
        'seller-profile-submit',
        'Не удалось отправить заявку',
        operation,
      );
    } finally {
      if (guard.currentOperation() === operation) {
        revisionSubmitInFlight.current = false;
        setRevisionSubmitActive(false);
        guard.endLockedTransition();
      }
    }
  };

  const continueFromStep = async (visibleStep: 1 | 2 | 3) => {
    if (guard.transitionLock.current || achievementGate.writeBlocksParent())
      return;
    const attempt = guard.captureAttempt();
    try {
      const saved = await save('transition');
      if (!saved || !attempt.stillOwnsScreen()) return;
      if (
        visibleStep !== 1 &&
        shouldAdvanceSellerApplication(saved.sellerProfile, visibleStep)
      ) {
        await advanceMutation.mutateAsync({
          epoch: attempt.epoch,
          operation: attempt.operation,
        });
        if (!attempt.stillOwnsScreen()) return;
      }
      router.push(createSellerProfileHref(visibleStep + 1));
    } catch (error) {
      reportError(error, 'seller-profile-step', undefined, attempt.operation);
    } finally {
      if (guard.currentOperation() === attempt.operation)
        guard.endLockedTransition();
    }
  };

  return {
    save,
    submitRevision,
    continueFromStep,
    saveMutation,
    advanceMutation,
    submitMutation,
    saveInFlight,
    revisionSubmitInFlight,
    revisionSubmitActive,
  };
}

export type ProfileSubmission = ReturnType<typeof useProfileSubmission>;
