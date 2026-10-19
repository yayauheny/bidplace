import { useCallback, useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import type { QueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import type { SellerProfileResponse } from '@bidplace/contracts';

import { AppText } from '../../components/ui';
import {
  applyFormFailure,
  getUserFacingErrorMessage,
  logInfrastructureError,
  readFormFailure,
} from '../../errors';
import { canWritePrivateCache } from '../../lib/query-cache';
import {
  sellerProfileQueryKey,
  profileFieldOrder,
  toFields,
} from './seller-profile-data';
import type {
  ProfileFields,
  ProfileRequirementControls,
} from './seller-profile-steps';
import { emptyProfileDraft, profileDraftSchema } from './profile-validation';
import type { ProfileOperationGuard } from './seller-profile-operation-guard';
import { persistedFieldOverrides } from './reconcile-saved-fields';

/**
 * Owns the profile form: the react-hook-form instance, hydration from the
 * server profile, the form-level alert and requirement reveal controls.
 */
export function useSellerProfileForm({
  queryClient,
  guard,
  sessionSlug,
  profile,
  isProfileLoading,
  hydrationToken,
}: {
  queryClient: QueryClient;
  guard: ProfileOperationGuard;
  sessionSlug: string | null;
  profile: SellerProfileResponse['sellerProfile'] | undefined;
  isProfileLoading: boolean;
  hydrationToken: string | undefined;
}) {
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
  const seenAuthEpoch = useRef(guard.authEpoch);
  const hydratedProfileToken = useRef<string | null>(null);
  const forceProfileHydration = useRef(false);
  const draftValidation = useRef({ epoch: 0, running: false });

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

  const reportError = (
    error: unknown,
    surface: string,
    fallback = 'Не удалось сохранить профиль',
    operation = guard.currentOperation(),
  ) => {
    if (!guard.screenOwnsOperation(operation)) return;
    logInfrastructureError(error, surface);
    const failure = readFormFailure(error, profileFieldOrder);
    if (failure.disposition === 'passthrough') {
      setFormAlert(getUserFacingErrorMessage(error, fallback));
      return;
    }
    applyFormFailure(form, failure, profileFieldOrder);
    setFormAlert(failure.formMessage);
  };

  const rememberSaved = (
    saved: SellerProfileResponse,
    submitted: ProfileFields,
  ) => {
    hydratedProfileToken.current =
      saved.editingRevision?.updatedAt ?? saved.sellerProfile.updatedAt;
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

  useEffect(() => {
    if (profile || !sessionSlug || form.getValues('slug')) return;
    form.setValue('slug', sessionSlug, { shouldValidate: true });
  }, [sessionSlug, form, profile]);

  useEffect(() => {
    if (isProfileLoading || !profile) return;
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
    isProfileLoading,
    queueProfileDraftValidation,
  ]);

  useEffect(() => {
    if (seenAuthEpoch.current === guard.authEpoch) return;
    seenAuthEpoch.current = guard.authEpoch;
    setFormAlert(null);
    setRequirementEpoch((epoch) => epoch + 1);
    // Read the installed session, not a possibly stale auth context during handoff.
    const sessionActive = canWritePrivateCache(queryClient, guard.authEpoch);
    const cached = sessionActive
      ? queryClient.getQueryData<SellerProfileResponse | null>(
          sellerProfileQueryKey,
        )
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
  }, [guard.authEpoch, form, queryClient, sessionSlug]);

  return {
    form,
    formAlert,
    setFormAlert,
    formAlertText,
    requirementEpoch,
    requirementControls,
    reportError,
    rememberSaved,
    noteHydratedToken: (token: string | undefined) => {
      if (token !== undefined) hydratedProfileToken.current = token;
    },
  };
}

export type SellerProfileForm = ReturnType<typeof useSellerProfileForm>;
