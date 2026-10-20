import { Link, useIsFocused, useNavigation, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { View, type ViewStyle } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import { ApiErrorCode, newAccountSlugSchema, type User, type LegalDocumentId, type LegalDocumentsResponse } from '@bidplace/contracts';
import { AppText, PrimaryButton, TextButton, TextField } from '../../components/ui';
import { FigmaButton } from '../../components/figma/FigmaButton';
import { MotionPressable } from '../../components/ui/MotionPressable';
import { AuthConsentCheckbox } from './auth-consent-checkbox';
import { AuthPasswordField } from './auth-password-field';
import { registerSubmission } from './auth-dismissal';
import { useAuthSheetComplete, useAuthSheetGuard } from './auth-sheet-context';
import { AuthGoogleIcon } from './auth-google-icon';
import { AuthLegalText, RegistrationLegalText, registrationConsentLabel } from './auth-legal-text';
import { LegalDocumentViewer } from './legal-document-viewer';
import { AuthTelegramIcon } from './auth-telegram-icon';
import { useAnalytics } from '../../providers/analytics-provider';
import { useAppTheme } from '../../providers/theme-provider';
import { useApiClient } from '../../providers/api-provider';
import { registerSessionChangeIsOwn, useAuth } from '../../providers/auth-provider';
import {
  useSlugAvailability,
  visibleSlugAvailability,
} from './use-slug-availability';
import { ApiClientError } from '@bidplace/api-client';
import type { NicknameSuggestions } from './nickname-suggestion-generator';
import { nicknameSuggestionGenerator } from './unique-names-generator-adapter';

import {
  applyFormFailure,
  authRequestMessage,
  AUTH_TURNSTILE_REQUIRED_COPY,
  AUTH_TURNSTILE_UNAVAILABLE_COPY,
  getUserFacingErrorMessage,
  readFormFailure,
} from '../../errors';
import {
  authKeys,
  currentAuthEpoch,
  readAuthEpoch,
} from '../../lib/query-cache';
import { usePrivateCacheEpoch } from '../../lib/use-private-cache-epoch';
import {
  loginFormSchema,
  registerFormSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from './schemas';
import type { SafeRedirect } from './auth-redirect';
import { TurnstileWidget, type TurnstileAvailability } from './turnstile-widget';

const registrationConfirmationFields = [
  'agreementAccepted',
  'privacyAcknowledged',
  'dataConsentGiven',
  'age18Confirmed',
] as const;

function aborted(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError'
  );
}

type LoginSuccessReceipt = {
  userId: string;
  epochId: number;
  controller: AbortController;
};

function loginValuesMatch(
  held: { email: string; password: string } | null,
  email: string,
  password: string,
): boolean {
  return held !== null && held.email === email && held.password === password;
}

/** Closed dialog roots are empty views. Keep them out of parent gap measurement. */
const dialogHostStyle: ViewStyle = {
  position: 'absolute',
  width: 0,
  height: 0,
};
type AuthFormProps = { redirectTo?: SafeRedirect };
export function LoginForm({ redirectTo = '/' }: AuthFormProps) {
  const palette = useAppTheme();
  const auth = useAuth();
  const api = useApiClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const focused = useIsFocused();
  const navigation = useNavigation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [challengeEmail, setChallengeEmail] = useState<string | null>(null);
  const [proof, setProof] = useState<string | null>(null);
  const [proofAvailability, setProofAvailability] = useState<TurnstileAvailability>('ready');
  const [widgetGeneration, setWidgetGeneration] = useState(0);
  const transport = useRef<AbortController | null>(null);
  const loginReceipt = useRef<LoginSuccessReceipt | null>(null);
  const submitting = useRef(false);
  const mounted = useRef(true);
  const focusedRef = useRef(focused);
  const privateCacheEpoch = usePrivateCacheEpoch(queryClient);
  const [providerNotice, setProviderNotice] = useState<string | null>(null);
  const [legalOpen, setLegalOpen] = useState<LegalDocumentId | null>(null);
  const [loginLegal, setLoginLegal] = useState<LegalDocumentsResponse | null>(null);
  const [legalError, setLegalError] = useState<string | null>(null);
  const [legalPending, setLegalPending] = useState(false);
  const legalTransport = useRef<AbortController | null>(null);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });
  const emailValue = form.watch('email');
  const passwordValue = form.watch('password');
  const normalizedEmail = emailValue.trim().toLowerCase();
  const challenge = challengeEmail !== null && challengeEmail === normalizedEmail;
  const submittedValues = useRef<{ email: string; password: string } | null>(null);
  const onProof = useCallback((token: string | null) => setProof(token), []);
  const onProofAvailability = useCallback((availability: TurnstileAvailability) => {
    setProofAvailability(availability);
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      transport.current?.abort();
      legalTransport.current?.abort();
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
    const current = submittedValues.current;
    if (!current || !transport.current) return;
    if (current.email !== emailValue || current.password !== passwordValue) transport.current.abort();
  }, [emailValue, passwordValue]);
  useEffect(() => {
    if (challengeEmail === null || normalizedEmail === challengeEmail) return;
    setChallengeEmail(null);
    setProof(null);
    setSubmitError(null);
    setWidgetGeneration((generation) => generation + 1);
  }, [challengeEmail, normalizedEmail]);
  const complete = useAuthSheetComplete();
  useAuthSheetGuard({
    dirty: Boolean(emailValue || passwordValue),
    busy: form.formState.isSubmitting,
  });
  const dropLoginReceipt = useCallback((controller?: AbortController) => {
    const receipt = loginReceipt.current;
    if (controller && receipt?.controller !== controller) return;
    loginReceipt.current = null;
    if (transport.current === receipt?.controller) {
      transport.current = null;
      submittedValues.current = null;
    }
  }, []);
  const admitLoginReceipt = useCallback(
    (receipt: LoginSuccessReceipt) => {
      const { controller } = receipt;
      if (controller.signal.aborted || !mounted.current || !focusedRef.current) {
        dropLoginReceipt(controller);
        return;
      }
      if (transport.current !== controller) {
        dropLoginReceipt(controller);
        return;
      }
      if (!loginValuesMatch(submittedValues.current, emailValue, passwordValue)) {
        dropLoginReceipt(controller);
        return;
      }
      const epoch = readAuthEpoch(queryClient);
      const installed = queryClient.getQueryData<User | null>(authKeys.session);
      if (
        epoch.id !== receipt.epochId ||
        !epoch.writesOpen ||
        installed?.id !== receipt.userId
      ) {
        dropLoginReceipt(controller);
        return;
      }
      loginReceipt.current = receipt;
    },
    [dropLoginReceipt, emailValue, passwordValue, queryClient],
  );
  useEffect(() => {
    const receipt = loginReceipt.current;
    if (!receipt) return;
    const { controller } = receipt;
    if (controller.signal.aborted || !mounted.current || !focusedRef.current) {
      dropLoginReceipt(controller);
      return;
    }
    if (transport.current !== controller) {
      dropLoginReceipt(controller);
      return;
    }
    if (!loginValuesMatch(submittedValues.current, emailValue, passwordValue)) {
      dropLoginReceipt(controller);
      return;
    }
    const epoch = readAuthEpoch(queryClient);
    if (epoch.id !== receipt.epochId || !epoch.writesOpen) {
      dropLoginReceipt(controller);
      return;
    }
    const installed = queryClient.getQueryData<User | null>(authKeys.session);
    if (installed?.id !== receipt.userId) {
      dropLoginReceipt(controller);
      return;
    }
    if (!auth.isAuthenticated || auth.user?.id !== receipt.userId) return;
    if (form.formState.isSubmitting) return;
    loginReceipt.current = null;
    transport.current = null;
    submittedValues.current = null;
    if (complete) complete(redirectTo);
    else router.replace(redirectTo as Href);
  }, [
    auth.isAuthenticated,
    auth.user?.id,
    complete,
    dropLoginReceipt,
    emailValue,
    form.formState.isSubmitting,
    passwordValue,
    privateCacheEpoch,
    queryClient,
    redirectTo,
    router,
  ]);
  const openLoginLegal = (id: LegalDocumentId) => {
    setLegalOpen(id);
    if (loginLegal || legalTransport.current) return;
    setLegalError(null);
    setLegalPending(true);
    const controller = new AbortController();
    legalTransport.current = controller;
    void api.auth.getLegalDocuments({ signal: controller.signal })
      .then((documents) => {
        if (!controller.signal.aborted && mounted.current) setLoginLegal(documents);
      })
      .catch(() => {
        if (!controller.signal.aborted && mounted.current) {
          setLegalError('Юридические документы пока не опубликованы.');
        }
      })
      .finally(() => {
        if (legalTransport.current === controller) legalTransport.current = null;
        if (!controller.signal.aborted && mounted.current) setLegalPending(false);
      });
  };
  const openPolicy = () => openLoginLegal('privacy');
  const openRules = () => openLoginLegal('agreement');
  const submitLogin = form.handleSubmit(async (values) => {
    if (challenge && proofAvailability === 'unavailable') {
      setSubmitError(AUTH_TURNSTILE_UNAVAILABLE_COPY);
      return;
    }
    if (challenge && !proof) {
      setSubmitError(AUTH_TURNSTILE_REQUIRED_COPY);
      return;
    }
    setSubmitError(null);
    dropLoginReceipt();
    transport.current?.abort();
    const controller = new AbortController();
    transport.current = controller;
    submittedValues.current = { email: values.email, password: values.password };
    const token = proof;
    if (challenge) {
      setProof(null);
      setWidgetGeneration((generation) => generation + 1);
    }
    try {
      const response = await auth.login(
        { email: values.email, password: values.password, ...(token ? { turnstileToken: token } : {}) },
        { signal: controller.signal },
      );
      const installed = queryClient.getQueryData<User | null>(authKeys.session);
      const epoch = readAuthEpoch(queryClient);
      const sameValues = loginValuesMatch(submittedValues.current, emailValue, passwordValue);
      if (
        controller.signal.aborted ||
        !mounted.current ||
        !focusedRef.current ||
        transport.current !== controller ||
        installed?.id !== response.user.id ||
        !epoch.writesOpen ||
        !sameValues
      ) {
        return;
      }
      admitLoginReceipt({
        userId: response.user.id,
        epochId: epoch.id,
        controller,
      });
    } catch (error) {
      if (controller.signal.aborted || aborted(error)) {
        dropLoginReceipt(controller);
        return;
      }
      const message = authRequestMessage(error);
      if (
        error instanceof ApiClientError &&
        error.code === ApiErrorCode.TURNSTILE_REQUIRED &&
        mounted.current &&
        focusedRef.current &&
        transport.current === controller
      ) {
        setChallengeEmail(values.email.trim().toLowerCase());
      }
      if (message) {
        setSubmitError(message);
        return;
      }
      const failure = readFormFailure(error, ['email', 'password']);
      if (failure.disposition === 'passthrough') {
        setSubmitError(getUserFacingErrorMessage(error, 'Не удалось войти'));
        return;
      }
      applyFormFailure(form, failure, ['email', 'password']);
      setSubmitError(failure.formMessage);
    } finally {
      if (transport.current === controller && loginReceipt.current?.controller !== controller) {
        transport.current = null;
        submittedValues.current = null;
      }
    }
  });
  const submit = () => {
    if (submitting.current) return;
    submitting.current = true;
    void Promise.resolve(submitLogin()).finally(() => {
      submitting.current = false;
    });
  };
  if (!auth.ready)
    return (
      <AppText role="bodySmall" tone="secondary">
        Подготавливаем форму…
      </AppText>
    );
  if (auth.isAuthenticated)
    return (
      <View style={{ gap: designTokens.auth.formGap }}>
        <AppText role="bodySmall">Перейдите к следующему шагу.</AppText>
        <PrimaryButton
          label="Перейти дальше"
          size="auth"
          width="full"
          onPress={() => {
            if (complete) complete(redirectTo);
            else router.replace(redirectTo as Href);
          }}
        />
      </View>
    );
  return (
      <View style={{ gap: designTokens.auth.loginGap }}>
      <View style={{ gap: designTokens.auth.loginFormGap }}>
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
        <View style={{ gap: designTokens.auth.titleGap }}>
          <Controller
            control={form.control}
            name="password"
            render={({ field }) => (
              <AuthPasswordField
                label="Пароль"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                autoComplete="current-password"
                metrics="authPassword"
                error={form.formState.errors.password?.message}
                onSubmitEditing={() => void submit()}
              />
            )}
          />
          <Link
            href={{
              pathname: '/forgot-password',
              params: redirectTo !== '/' ? { redirectTo } : undefined,
            }}
            asChild
          >
            <MotionPressable
              accessibilityRole="link"
              accessibilityLabel="Забыли пароль?"
              onPress={() => undefined}
              style={{ alignSelf: 'flex-end' }}
            >
              <AppText role="fieldError" style={{ color: palette.textSubdued, fontSize: 12 }}>
                Забыли пароль?
              </AppText>
            </MotionPressable>
          </Link>
        </View>
        {challenge ? (
          <TurnstileWidget
            key={widgetGeneration}
            action="login"
            onToken={onProof}
            onAvailability={onProofAvailability}
          />
        ) : null}
        {submitError ? (
          <AppText
            role="bodySmall"
            tone="danger"
            accessibilityLiveRegion="polite"
          >
            {submitError}
          </AppText>
        ) : null}
        {providerNotice ? (
          <AppText role="bodySmall" accessibilityLiveRegion="polite">
            {providerNotice}
          </AppText>
        ) : null}
        <PrimaryButton
          label="Войти"
          size="auth"
          width="full"
          loading={form.formState.isSubmitting}
          onPress={submit}
        />
        <FigmaButton
          label="Регистрация"
          variant="ghost"
          size="auth"
          width="full"
          href={{
            pathname: '/register',
            params: redirectTo !== '/' ? { redirectTo } : undefined,
          }}
        />
        </View>
        <AppText role="authOr" style={{ textAlign: 'center', color: palette.textSubdued }}>
          или
        </AppText>
        <View style={{ gap: designTokens.auth.loginFormGap }}>
        <FigmaButton
          label="Войти с Telegram"
          iconNode={<AuthTelegramIcon />}
          variant="outline"
          size="auth"
          width="full"
          onPress={() => setProviderNotice('Вход через Telegram пока недоступен')}
        />
        <FigmaButton
          label="Войти с Google"
          iconNode={<AuthGoogleIcon />}
          variant="outline"
          size="auth"
          width="full"
          onPress={() => setProviderNotice('Вход через Google пока недоступен')}
        />
        </View>
        <AuthLegalText
          variant="login"
          textAlign="center"
          onOpenPolicy={openPolicy}
          onOpenRules={openRules}
        />
        {legalError ? (
          <AppText role="bodySmall" tone="danger" accessibilityLiveRegion="polite">{legalError}</AppText>
        ) : null}
        <View pointerEvents="box-none" style={dialogHostStyle}>
          <LegalDocumentViewer
            selected={legalOpen}
            documents={loginLegal}
            loading={legalPending}
            onClose={() => setLegalOpen(null)}
          />
        </View>
      </View>
  );
}
type RegistrationStep = 'email' | 'nickname' | 'password';

const registrationCopy: Record<RegistrationStep, { title: string; caption: string }> = {
  email: {
    title: 'Введите вашу почту',
    caption: 'Зарегистрируйтесь или войдите',
  },
  nickname: {
    title: 'Выберите имя пользователя',
    caption: 'Можете выбрать любой или предложений',
  },
  password: {
    title: 'Создайте пароль',
    caption: 'Пусть он будет надежный',
  },
};

function nicknameAvailabilityError(error: unknown) {
  if (error instanceof ApiClientError && error.kind === 'rate_limited') {
    return 'Слишком много проверок. Подождите и попробуйте снова.';
  }
  if (
    error instanceof ApiClientError &&
    (error.kind === 'network' ||
      error.kind === 'server' ||
      error.kind === 'unexpected_response')
  ) {
    return 'Не удалось проверить никнейм. Проверьте соединение и повторите.';
  }
  return 'Не удалось проверить никнейм. Попробуйте ещё раз.';
}

function NicknameSuggestionList({
  suggestions,
  onSelect,
}: {
  suggestions: NicknameSuggestions;
  onSelect: (suggestion: string) => void;
}) {
  const palette = useAppTheme();
  return (
    <View
      nativeID="nickname-suggestions"
      style={{ gap: designTokens.space.x2, width: '100%' }}
    >
      <AppText
        role="metadata"
        style={{
          color: palette.fieldLabel,
          textAlign: 'center',
          ...designTokens.typography.authSuggestionLabel,
        }}
      >
        Предложения:
      </AppText>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: designTokens.space.x1,
        }}
      >
        {suggestions.map((suggestion) => (
          <FigmaButton
            key={suggestion}
            label={suggestion}
            accessibilityHint="Заполнить поле никнейма"
            variant="outline"
            size="suggestion"
            onPress={() => onSelect(suggestion)}
          />
        ))}
      </View>
    </View>
  );
}

export function RegisterForm({ redirectTo = '/' }: AuthFormProps) {
  const palette = useAppTheme();
  const auth = useAuth();
  const api = useApiClient();
  const analytics = useAnalytics();
  const router = useRouter();
  const queryClient = useQueryClient();
  const authEpoch = usePrivateCacheEpoch(queryClient);
  const [step, setStep] = useState<RegistrationStep>('email');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const trackedRegistrationStart = useRef(false);
  const openedAuthenticated = useRef<boolean | null>(null);
  const sessionOperation = useRef(0);
  const nicknameAdvancePending = useRef(false);
  const nicknameAdvanceOperation = useRef(0);
  const seenAuthEpoch = useRef(authEpoch);
  const mounted = useRef(true);
  const completed = useRef(false);
  const registerTransport = useRef<AbortController | null>(null);
  const registerSnapshot = useRef<string | null>(null);
  const registerSubmitting = useRef(false);
  const [proof, setProof] = useState<string | null>(null);
  const [proofAvailability, setProofAvailability] = useState<TurnstileAvailability>('ready');
  const [widgetGeneration, setWidgetGeneration] = useState(0);
  const onProof = useCallback((token: string | null) => setProof(token), []);
  const onProofAvailability = useCallback((availability: TurnstileAvailability) => {
    setProofAvailability(availability);
  }, []);
  const focused = useIsFocused();
  const navigation = useNavigation();
  const focusedRef = useRef(focused);
  const wasFocused = useRef(focused);
  const [legalDocuments, setLegalDocuments] = useState<LegalDocumentsResponse | null>(null);
  const [registrationLegalError, setRegistrationLegalError] = useState<string | null>(null);
  const [registrationLegalPending, setRegistrationLegalPending] = useState(false);
  const [registrationLegalOpen, setRegistrationLegalOpen] = useState<LegalDocumentId | null>(null);
  const legalRequest = useRef(0);
  const registrationLegalTransport = useRef<AbortController | null>(null);
  const [suggestions, setSuggestions] = useState<NicknameSuggestions>(() =>
    nicknameSuggestionGenerator.generate(),
  );
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: '',
      slug: '',
      password: '',
      confirmPassword: '',
      phone: '',
      agreementAccepted: false,
      privacyAcknowledged: false,
      dataConsentGiven: false,
      age18Confirmed: false,
    },
  });
  const watched = form.watch();
  const registrationValuesSnapshot = JSON.stringify(watched);
  const {
    check: checkSlugAvailability,
    invalidate: invalidateSlugAvailability,
    result: slugAvailabilityResult,
  } = useSlugAvailability();
  const slugAvailability = visibleSlugAvailability(
    watched.slug,
    slugAvailabilityResult,
  );
  const complete = useAuthSheetComplete();
  const sessionUser = () =>
    queryClient.getQueryData<User | null>(authKeys.session) ?? null;
  const routeOwns = (operation: number) =>
    mounted.current && focusedRef.current && sessionOperation.current === operation;
  const anonymousOwns = (operation: number, epoch: number) =>
    routeOwns(operation) &&
    (sessionUser()?.id ?? null) === null &&
    currentAuthEpoch(queryClient) === epoch;
  const finishRegistration = (user: User, operation?: number) => {
    if (!mounted.current || !focusedRef.current || completed.current) return;
    if (operation !== undefined && sessionOperation.current !== operation) return;
    completed.current = true;
    const next = user.emailVerifiedAt
      ? redirectTo
      : (`/verify-email?redirectTo=${encodeURIComponent(redirectTo)}` as SafeRedirect);
    if (complete) complete(next);
    else router.replace(next as Href);
  };
  useAuthSheetGuard({
    dirty: Boolean(
      watched.slug ||
        watched.email ||
        watched.password ||
        watched.confirmPassword ||
        watched.agreementAccepted ||
        watched.privacyAcknowledged ||
        watched.dataConsentGiven ||
        watched.age18Confirmed,
    ),
    busy: form.formState.isSubmitting,
  });
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      registerTransport.current?.abort();
      registrationLegalTransport.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (registerSnapshot.current && registerTransport.current && registrationValuesSnapshot !== registerSnapshot.current) {
      registerTransport.current.abort();
    }
  }, [registrationValuesSnapshot]);
  useEffect(() => {
    const markBlurred = () => {
      focusedRef.current = false;
      registerTransport.current?.abort();
      sessionOperation.current += 1;
      nicknameAdvanceOperation.current += 1;
      nicknameAdvancePending.current = false;
      invalidateSlugAvailability();
    };
    const markFocused = () => {
      focusedRef.current = true;
    };
    const unblur = navigation.addListener('blur', markBlurred);
    const unfocus = navigation.addListener('focus', markFocused);
    return () => {
      unblur();
      unfocus();
    };
  }, [invalidateSlugAvailability, navigation]);
  useEffect(() => {
    if (wasFocused.current && !focused) {
      focusedRef.current = false;
      registerTransport.current?.abort();
      sessionOperation.current += 1;
      nicknameAdvanceOperation.current += 1;
      nicknameAdvancePending.current = false;
      invalidateSlugAvailability();
    }
    if (focused) focusedRef.current = true;
    wasFocused.current = focused;
  }, [focused, invalidateSlugAvailability]);
  useEffect(() => {
    if (seenAuthEpoch.current === authEpoch) return;
    seenAuthEpoch.current = authEpoch;
    if (registerSessionChangeIsOwn(queryClient, authEpoch)) return;
    sessionOperation.current += 1;
    nicknameAdvanceOperation.current += 1;
    nicknameAdvancePending.current = false;
    invalidateSlugAvailability();
    setRegistrationLegalOpen(null);
    // Guest bootstrap can rotate the epoch before any registration attempt.
    if (mounted.current && Object.values(form.getValues()).some(Boolean)) {
      setSubmitError('Сессия изменилась. Повторите регистрацию.');
    }
  }, [authEpoch, form, invalidateSlugAvailability, queryClient]);

  useEffect(() => {
    if (trackedRegistrationStart.current) {
      return;
    }
    trackedRegistrationStart.current = true;
    analytics.track('registration_started', {});
  }, [analytics]);

  const loadRegistrationLegal = () => {
    const request = ++legalRequest.current;
    registrationLegalTransport.current?.abort();
    const controller = new AbortController();
    registrationLegalTransport.current = controller;
    setLegalDocuments(null);
    // An earlier checkbox click is never treated as acceptance of a newer or unavailable version.
    for (const key of registrationConfirmationFields) {
      form.setValue(key, false);
    }
    setRegistrationLegalPending(true);
    setRegistrationLegalError(null);
    void api.auth.getLegalDocuments({ signal: controller.signal })
      .then((documents) => {
        if (!mounted.current || controller.signal.aborted || request !== legalRequest.current) return;
        setLegalDocuments(documents);
        setRegistrationLegalPending(false);
      })
      .catch(() => {
        if (!mounted.current || controller.signal.aborted || request !== legalRequest.current) return;
        setLegalDocuments(null);
        setRegistrationLegalError('Юридические документы пока не опубликованы. Регистрация временно недоступна.');
        setRegistrationLegalPending(false);
      })
      .finally(() => {
        if (registrationLegalTransport.current === controller) registrationLegalTransport.current = null;
      });
  };
  useEffect(() => {
    // Initial fetch only. Manual retries must not reset checks on ordinary re-renders.
    loadRegistrationLegal();
  }, []);

  const submitRegistration = form.handleSubmit(async (values) => {
    setSubmitError(null);
    const operation = sessionOperation.current;
    const epoch = currentAuthEpoch(queryClient);
    if (!anonymousOwns(operation, epoch)) return;
    if (!legalDocuments || legalDocuments.documents.length !== 5) {
      setSubmitError('Не удалось получить действующие юридические документы.');
      return;
    }
    if (proofAvailability === 'unavailable') {
      setSubmitError(AUTH_TURNSTILE_UNAVAILABLE_COPY);
      return;
    }
    if (!proof) {
      setSubmitError(AUTH_TURNSTILE_REQUIRED_COPY);
      return;
    }
    registerTransport.current?.abort();
    const controller = new AbortController();
    registerTransport.current = controller;
    registerSnapshot.current = JSON.stringify(form.getValues());
    const token = proof;
    setProof(null);
    setWidgetGeneration((generation) => generation + 1);
    try {
      const response = await auth.register(
        { ...registerSubmission(values, legalDocuments.version), turnstileToken: token },
        { signal: controller.signal },
      );
      if (controller.signal.aborted || !routeOwns(operation)) return;
      if ((sessionUser()?.id ?? null) !== response.user.id) {
        setSubmitError('Сессия изменилась. Повторите регистрацию.');
        return;
      }
      analytics.identify(response.user.id, { claimAcquisition: true });
      finishRegistration(response.user, operation);
    } catch (error) {
      if (controller.signal.aborted || aborted(error)) return;
      if (!anonymousOwns(operation, epoch)) return;
      if (
        error instanceof ApiClientError &&
        error.kind === 'conflict' &&
        typeof error.details === 'object' &&
        error.details !== null &&
        'reason' in error.details &&
        error.details.reason === 'legal_version_stale'
      ) {
        setStep('email');
        setLegalDocuments(null);
        form.setValue('agreementAccepted', false);
        form.setValue('privacyAcknowledged', false);
        form.setValue('dataConsentGiven', false);
        form.setValue('age18Confirmed', false);
        loadRegistrationLegal();
        setSubmitError('Редакция документов изменилась. Ознакомьтесь с ней и подтвердите ещё раз.');
        return;
      }
      const message = authRequestMessage(error);
      if (message) {
        setSubmitError(message);
        return;
      }
      const failure = readFormFailure(error, ['email', 'slug', 'password', 'phone']);
      if (failure.disposition === 'passthrough') {
        setSubmitError(getUserFacingErrorMessage(error, 'Не удалось зарегистрироваться'));
        return;
      }
      applyFormFailure(form, failure, ['email', 'slug', 'password', 'phone']);
      if (failure.fields.slug) {
        nicknameAdvanceOperation.current += 1;
        nicknameAdvancePending.current = false;
        invalidateSlugAvailability();
        setStep('nickname');
      }
      if (failure.fields.email) setStep('email');
      setSubmitError(failure.formMessage);
    } finally {
      if (registerTransport.current === controller) {
        registerTransport.current = null;
        registerSnapshot.current = null;
      }
    }
  });
  const submit = () => {
    if (registerSubmitting.current) return;
    registerSubmitting.current = true;
    void Promise.resolve(submitRegistration()).finally(() => {
      registerSubmitting.current = false;
    });
  };
  const goNext = async () => {
    if (!mounted.current || !focusedRef.current) return;
    setSubmitError(null);
    if (step === 'email') {
      const emailOk = await form.trigger('email');
      // Do not blame the visitor for unchecked controls that were disabled
      // because the operator has not published the legal documents.
      if (!legalDocuments || legalDocuments.documents.length !== 5) {
        setSubmitError('Юридические документы пока недоступны.');
        return;
      }
      const consentOk = await form.trigger([
        'agreementAccepted', 'privacyAcknowledged', 'dataConsentGiven', 'age18Confirmed',
      ]);
      if (!emailOk || !consentOk) return;
      setStep('nickname');
      return;
    }
    if (step === 'nickname') {
      if (nicknameAdvancePending.current) return;
      const advanceOperation = nicknameAdvanceOperation.current + 1;
      nicknameAdvanceOperation.current = advanceOperation;
      nicknameAdvancePending.current = true;
      try {
        const slugOk = await form.trigger('slug');
        if (nicknameAdvanceOperation.current !== advanceOperation) return;
        if (!slugOk) {
          invalidateSlugAvailability();
          return;
        }
        const parsed = newAccountSlugSchema.safeParse(form.getValues('slug'));
        if (!parsed.success) return;
        const requested = parsed.data;
        const routeOperation = sessionOperation.current;
        const epoch = currentAuthEpoch(queryClient);
        if (!anonymousOwns(routeOperation, epoch)) return;
        const availability = await checkSlugAvailability(requested);
        if (
          nicknameAdvanceOperation.current !== advanceOperation ||
          !availability ||
          !anonymousOwns(routeOperation, epoch)
        )
          return;
        const current = newAccountSlugSchema.safeParse(form.getValues('slug'));
        if (!current.success || current.data !== requested) return;
        if (availability.status === 'available') {
          form.clearErrors('slug');
          setStep('password');
          return;
        }
        if (availability.status === 'taken') {
          form.clearErrors('slug');
          setSuggestions((currentSuggestions) =>
            nicknameSuggestionGenerator.generate(currentSuggestions),
          );
        }
      } finally {
        if (nicknameAdvanceOperation.current === advanceOperation) {
          nicknameAdvancePending.current = false;
        }
      }
      return;
    }
    if (registerSubmitting.current) return;
    await submit();
  };
  if (auth.ready && openedAuthenticated.current === null) {
    openedAuthenticated.current = auth.isAuthenticated;
  }
  if (!auth.ready)
    return (
      <AppText role="bodySmall" tone="secondary">
        Подготавливаем форму…
      </AppText>
    );
  const visitor = auth.user;
  if (openedAuthenticated.current && auth.isAuthenticated && visitor)
    return (
      <View style={{ gap: designTokens.auth.screenGap }}>
        <AppText role="bodySmall">Перейдите к следующему шагу.</AppText>
        <PrimaryButton
          label="Дальше"
          size="auth"
          width="full"
          onPress={() => finishRegistration(visitor)}
        />
      </View>
    );
  const copy = registrationCopy[step];
  const nicknameStatus =
    step === 'nickname' && slugAvailability
      ? slugAvailability.status === 'checking'
        ? {
            color: palette.textSubdued,
            text: 'Проверяем никнейм…',
          }
        : slugAvailability.status === 'available'
          ? {
              color: palette.usernameAvailable,
              text: `@${slugAvailability.slug} доступен`,
            }
          : slugAvailability.status === 'taken'
            ? {
                color: palette.usernameTaken,
                text: `@${slugAvailability.slug} недоступен`,
              }
            : {
                color: palette.usernameTaken,
                text: nicknameAvailabilityError(slugAvailability.error),
              }
      : null;
  const nextAction = (
    <PrimaryButton
      label="Дальше"
      size="auth"
      width="full"
      loading={
        form.formState.isSubmitting ||
        slugAvailability?.status === 'checking' ||
        (step === 'email' && registrationLegalPending)
      }
      disabled={step === 'email' && !legalDocuments}
      onPress={() => void goNext()}
    />
  );
  const submitFeedback = submitError ? (
    <AppText
      role="bodySmall"
      tone="danger"
      accessibilityLiveRegion="polite"
    >
      {submitError}
    </AppText>
  ) : null;
  return (
      <View style={{ gap: designTokens.auth.screenGap, width: '100%' }}>
        <View style={{ gap: designTokens.auth.titleGap }}>
          <AppText role="sectionTitle" style={{ textAlign: 'center', color: palette.fieldValue, ...designTokens.typography.authScreenTitle }}>
            {copy.title}
          </AppText>
          <AppText role="bodySmall" style={{ textAlign: 'center', color: palette.textSubdued, ...designTokens.typography.authCaption, letterSpacing: 0 }}>
            {copy.caption}
          </AppText>
          {step === 'nickname' ? (
            <View
              nativeID="nickname-status-slot"
              style={{
                minHeight: 46,
                width: '100%',
                alignItems: 'center',
              }}
            >
              {nicknameStatus ? (
                <AppText
                  nativeID="nickname-availability-status"
                  role="authStatus"
                  accessibilityLiveRegion="polite"
                  style={{
                    color: nicknameStatus.color,
                    textAlign: 'center',
                  }}
                >
                  {nicknameStatus.text}
                </AppText>
              ) : null}
            </View>
          ) : null}
        </View>
        {step === 'nickname' ? (
          <View style={{ gap: designTokens.space.x6, width: '100%' }}>
            <View style={{ gap: designTokens.auth.formGap, width: '100%' }}>
              <Controller
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <TextField ref={field.ref}
                    label="Никнейм"
                    icon="at-sign"
                    iconColor={palette.fieldIcon}
                    value={field.value}
                    onChangeText={(value) => {
                      nicknameAdvanceOperation.current += 1;
                      nicknameAdvancePending.current = false;
                      invalidateSlugAvailability();
                      field.onChange(value.replace(/^@+/, ''));
                    }}
                    onBlur={field.onBlur}
                    placeholder="Никнейм"
                    autoCapitalize="none"
                    autoComplete="username"
                    error={form.formState.errors.slug?.message}
                  />
                )}
              />
              {submitFeedback}
              {nextAction}
            </View>
            <NicknameSuggestionList
              suggestions={suggestions}
              onSelect={(suggestion) => {
                nicknameAdvanceOperation.current += 1;
                nicknameAdvancePending.current = false;
                invalidateSlugAvailability();
                form.clearErrors('slug');
                form.setValue('slug', suggestion, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });
              }}
            />
          </View>
        ) : (
        <View style={{ gap: designTokens.auth.formGap, width: '100%' }}>
        {step === 'email' ? (
          <Controller
            control={form.control}
            name="email"
            render={({ field }) => (
              <TextField ref={field.ref}
                label="Электронная почта"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="example@gmail.com"
                autoComplete="email"
                keyboardType="email-address"
                error={form.formState.errors.email?.message}
              />
            )}
          />
        ) : null}
        {step === 'password' ? (
          <>
            <Controller
              control={form.control}
              name="password"
              render={({ field }) => (
                <AuthPasswordField
                  label="Введите пароль"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  autoComplete="new-password"
                  metrics="authScreenPassword"
                  editable={!form.formState.isSubmitting}
                  error={form.formState.errors.password?.message}
                />
              )}
            />
            <Controller
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <AuthPasswordField
                  label="Подтвердите пароль"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  autoComplete="new-password"
                  metrics="authScreenPassword"
                  editable={!form.formState.isSubmitting}
                  error={form.formState.errors.confirmPassword?.message}
                />
              )}
            />
            <TurnstileWidget
                key={widgetGeneration}
                action="register"
                onToken={onProof}
                onAvailability={onProofAvailability}
              />
          </>
        ) : null}
        {submitFeedback}
        {nextAction}
        {step === 'email' ? (
          <View style={{ gap: designTokens.space.x3 }}>
            <AuthConsentCheckbox
              checked={registrationConfirmationFields.every((key) => watched[key])}
              disabled={!legalDocuments || registrationLegalPending}
              label={registrationConsentLabel}
              onChange={(checked) => {
                for (const key of registrationConfirmationFields) {
                  form.setValue(key, checked, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
              error={
                registrationConfirmationFields.some((key) => form.formState.errors[key])
                  ? 'Подтвердите документы и возраст 18+.'
                  : undefined
              }
            >
              <RegistrationLegalText onOpenDocument={setRegistrationLegalOpen} />
            </AuthConsentCheckbox>
            {registrationLegalPending ? (
              <AppText role="bodySmall" tone="secondary">Загружаем юридические документы…</AppText>
            ) : null}
            {registrationLegalError ? (
              <>
                <AppText role="bodySmall" tone="danger">{registrationLegalError}</AppText>
                <TextButton label="Повторить" onPress={loadRegistrationLegal} />
              </>
            ) : null}
          </View>
        ) : null}
        <View pointerEvents="box-none" style={dialogHostStyle}>
          <LegalDocumentViewer
            selected={registrationLegalOpen}
            documents={legalDocuments}
            loading={registrationLegalPending}
            onClose={() => setRegistrationLegalOpen(null)}
          />
        </View>
        </View>
        )}
      </View>
  );
}

