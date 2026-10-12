import { useIsFocused, useNavigation, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';
import { ApiErrorCode } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';
import { ApiClientError } from '@bidplace/api-client';

import { AppText, PrimaryButton, TextButton, TextField } from '../../components/ui';
import { FigmaButton } from '../../components/figma/FigmaButton';
import {
  applyFormFailure,
  authRequestMessage,
  AUTH_RECOVERY_ACCEPTED_COPY,
  AUTH_RECOVERY_PROMPT_COPY,
  AUTH_TURNSTILE_REQUIRED_COPY,
  AUTH_TURNSTILE_UNAVAILABLE_COPY,
  getUserFacingErrorMessage,
  readFormFailure,
} from '../../errors';
import { authKeys, currentAuthEpoch, readAuthEpoch, subscribeAuthEpoch } from '../../lib/query-cache';
import { useApiClient } from '../../providers/api-provider';
import type { SafeRedirect } from './auth-redirect';
import { useAuthSheetGuard } from './auth-sheet-context';
import {
  createRecoveryOperation,
  recoveryAfter,
  recoveryKeyFor,
  type ReadyRecoveryOperation,
  type RecoveryAttempt,
} from './recovery-operation';
import { TurnstileWidget, type TurnstileAvailability } from './turnstile-widget';
import { forgotPasswordFormSchema, type ForgotPasswordFormValues } from './schemas';

type ForgotPasswordFormProps = { redirectTo?: SafeRedirect };

function loginHref(redirectTo: SafeRedirect) {
  return {
    pathname: '/login' as const,
    params: redirectTo !== '/' ? { redirectTo } : undefined,
  };
}

function aborted(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError'
  );
}

function recoveryAttempt(error: unknown): RecoveryAttempt {
  if (!(error instanceof ApiClientError)) return 'uncertain';
  if (
    error.kind === 'network' ||
    error.kind === 'server' ||
    error.kind === 'unexpected_response' ||
    error.code === ApiErrorCode.TURNSTILE_UNAVAILABLE ||
    error.code === ApiErrorCode.TURNSTILE_FAILED
  ) {
    return 'uncertain';
  }
  return 'refused';
}

export function ForgotPasswordForm({ redirectTo = '/' }: ForgotPasswordFormProps) {
  const api = useApiClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const focused = useIsFocused();
  const navigation = useNavigation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [proof, setProof] = useState<string | null>(null);
  const [proofAvailability, setProofAvailability] = useState<TurnstileAvailability>('ready');
  const [widgetGeneration, setWidgetGeneration] = useState(0);
  const operation = useRef(createRecoveryOperation());
  const transport = useRef<AbortController | null>(null);
  const submitting = useRef(false);
  const submittedEmail = useRef<string | null>(null);
  const requestEpoch = useRef(0);
  const requestSession = useRef<string | null>(null);
  const mounted = useRef(true);
  const focusedRef = useRef(focused);
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: '' },
  });
  const emailValue = form.watch('email');
  const onProof = useCallback((token: string | null) => setProof(token), []);
  const onProofAvailability = useCallback((availability: TurnstileAvailability) => {
    setProofAvailability(availability);
  }, []);
  useAuthSheetGuard({
    dirty: Boolean(emailValue) && !submitted,
    busy: form.formState.isSubmitting,
  });
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      transport.current?.abort();
    };
  }, []);
  useEffect(() => {
    focusedRef.current = focused;
    if (!focused) transport.current?.abort();
  }, [focused]);
  useEffect(() => {
    return navigation.addListener('blur', () => {
      focusedRef.current = false;
      transport.current?.abort();
    });
  }, [navigation]);
  useEffect(() => {
    const current = submittedEmail.current;
    if (!current || !transport.current) return;
    if (current !== emailValue) transport.current.abort();
  }, [emailValue]);
  useEffect(() => {
    return subscribeAuthEpoch(queryClient, () => {
      if (!transport.current) return;
      const epoch = readAuthEpoch(queryClient);
      const sessionId =
        queryClient.getQueryData<{ id: string } | null>(authKeys.session)?.id ?? null;
      if (
        !epoch.writesOpen ||
        epoch.id !== requestEpoch.current ||
        sessionId !== requestSession.current
      ) {
        transport.current.abort();
      }
    });
  }, [queryClient]);

  const submitRecovery = form.handleSubmit(async (values) => {
    if (proofAvailability === 'unavailable') {
      setSubmitError(AUTH_TURNSTILE_UNAVAILABLE_COPY);
      return;
    }
    if (!proof) {
      setSubmitError(AUTH_TURNSTILE_REQUIRED_COPY);
      return;
    }
    setSubmitError(null);
    const startedSession =
      queryClient.getQueryData<{ id: string } | null>(authKeys.session)?.id ?? null;
    const startedEpoch = currentAuthEpoch(queryClient);
    let issued: ReadyRecoveryOperation;
    try {
      issued = recoveryKeyFor(operation.current, values.email);
    } catch (error) {
      if (!aborted(error)) {
        setSubmitError('Не удалось подготовить запрос. Повторите попытку.');
      }
      return;
    }
    operation.current = issued;
    requestEpoch.current = startedEpoch;
    requestSession.current = startedSession;
    transport.current?.abort();
    const controller = new AbortController();
    transport.current = controller;
    submittedEmail.current = values.email;
    const token = proof;
    setProof(null);
    setWidgetGeneration((generation) => generation + 1);
    const owns = (error?: unknown) => {
      const epoch = readAuthEpoch(queryClient);
      const sessionId =
        queryClient.getQueryData<{ id: string } | null>(authKeys.session)?.id ?? null;
      return (
        !controller.signal.aborted &&
        !aborted(error) &&
        mounted.current &&
        focusedRef.current &&
        transport.current === controller &&
        operation.current === issued &&
        epoch.writesOpen &&
        epoch.id === startedEpoch &&
        sessionId === startedSession
      );
    };
    try {
      await api.auth.forgotPassword(
        {
          email: values.email,
          idempotencyKey: issued.key,
          turnstileToken: token,
        },
        { signal: controller.signal },
      );
      if (!owns()) return;
      operation.current = recoveryAfter(issued, 'new');
      setSubmitted(true);
    } catch (error) {
      if (!owns(error)) return;
      operation.current = recoveryAfter(issued, recoveryAttempt(error));
      const message = authRequestMessage(error);
      if (message) {
        setSubmitError(message);
        return;
      }
      const failure = readFormFailure(error, ['email']);
      if (failure.disposition === 'passthrough') {
        setSubmitError(getUserFacingErrorMessage(error, 'Не удалось отправить запрос'));
        return;
      }
      applyFormFailure(form, failure, ['email']);
      setSubmitError(failure.formMessage);
    } finally {
      if (transport.current === controller) {
        transport.current = null;
        submittedEmail.current = null;
      }
    }
  });
  const submit = () => {
    if (submitting.current) return;
    submitting.current = true;
    void Promise.resolve(submitRecovery()).finally(() => {
      submitting.current = false;
    });
  };

  if (submitted) {
    return (
      <View style={{ gap: designTokens.auth.formGap }}>
        <AppText role="bodySmall">{AUTH_RECOVERY_ACCEPTED_COPY}</AppText>
        <TextButton
          label="Отправить ещё раз"
          onPress={() => {
            operation.current = recoveryAfter(operation.current, 'new');
            setProof(null);
            setWidgetGeneration((generation) => generation + 1);
            setSubmitted(false);
          }}
        />
        <PrimaryButton
          label="Вернуться ко входу"
          size="auth"
          width="full"
          onPress={() => router.replace(loginHref(redirectTo) as Href)}
        />
      </View>
    );
  }

  return (
      <View style={{ gap: designTokens.auth.formGap }}>
        <AppText role="bodySmall">{AUTH_RECOVERY_PROMPT_COPY}</AppText>
        <Controller
          control={form.control}
          name="email"
          render={({ field }) => (
            <TextField ref={field.ref}
              label="Электронная почта"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Электронная почта"
              autoComplete="email"
              keyboardType="email-address"
              error={form.formState.errors.email?.message}
            />
          )}
        />
        <TurnstileWidget
          key={widgetGeneration}
          action="password_reset"
          onToken={onProof}
          onAvailability={onProofAvailability}
        />
        {submitError ? (
          <AppText role="bodySmall" tone="danger" accessibilityLiveRegion="polite">
            {submitError}
          </AppText>
        ) : null}
        <PrimaryButton
          label="Отправить ссылку"
          size="auth"
          width="full"
          loading={form.formState.isSubmitting}
          onPress={submit}
        />
        <FigmaButton
          label="Вернуться ко входу"
          variant="ghost"
          size="auth"
          width="full"
          href={loginHref(redirectTo)}
        />
      </View>
  );
}
