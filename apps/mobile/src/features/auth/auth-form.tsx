import { Link, useIsFocused, useNavigation, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { View, type ViewStyle } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import { ApiErrorCode, newAccountSlugSchema, type User } from '@bidplace/contracts';
import { AppDialog, AppText, PrimaryButton, TextButton, TextField } from '../../components/ui';
import { FigmaButton } from '../../components/figma/FigmaButton';
import { MotionPressable } from '../../components/ui/MotionPressable';
import { AuthConsentCheckbox } from './auth-consent-checkbox';
import { AuthPasswordField } from './auth-password-field';
import { registerSubmission } from './auth-dismissal';
import { useAuthSheetComplete, useAuthSheetGuard } from './auth-sheet-context';
import { AuthGoogleIcon } from './auth-google-icon';
import {
  AUTH_POLICY_STUB_BODY,
  AUTH_POLICY_STUB_TITLE,
  AuthLegalText,
} from './auth-legal-text';
import { AuthTelegramIcon } from './auth-telegram-icon';
import { useAnalytics } from '../../providers/analytics-provider';
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
  canWritePrivateCache,
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
  const [policyOpen, setPolicyOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rulesText, setRulesText] = useState<string | null>(null);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const rulesPending = useRef(false);
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
  const loadLoginRules = () => {
    if (rulesPending.current || rulesText) return;
    rulesPending.current = true;
    setRulesError(null);
    void api.auth
      .getRules()
      .then((response) => {
        setRulesText(response.rules.text);
      })
      .catch(() => {
        setRulesText(null);
        setRulesError('Не удалось получить правила.');
      })
      .finally(() => {
        rulesPending.current = false;
      });
  };
  const openPolicy = () => setPolicyOpen(true);
  const openRules = () => {
    setRulesOpen(true);
    loadLoginRules();
  };
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
              <AppText role="fieldError" style={{ color: designTokens.color.textSubdued, fontSize: 12 }}>
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
          width="full"
          loading={form.formState.isSubmitting}
          onPress={submit}
        />
        <Link
          href={{
            pathname: '/register',
            params: redirectTo !== '/' ? { redirectTo } : undefined,
          }}
          asChild
        >
          <FigmaButton
            label="Регистрация"
            variant="ghost"
            width="full"
            onPress={() => undefined}
          />
        </Link>
        </View>
        <AppText role="authOr" style={{ textAlign: 'center', color: designTokens.color.textSubdued }}>
          или
        </AppText>
        <View style={{ gap: designTokens.auth.loginFormGap }}>
        <FigmaButton
          label="Войти с Telegram"
          iconNode={<AuthTelegramIcon />}
          variant="outline"
          width="full"
          onPress={() => setProviderNotice('Вход через Telegram пока недоступен')}
        />
        <FigmaButton
          label="Войти с Google"
          iconNode={<AuthGoogleIcon />}
          variant="outline"
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
        {rulesError ? (
          <AppText role="bodySmall" tone="danger" accessibilityLiveRegion="polite">
            {rulesError}
          </AppText>
        ) : null}
        <View pointerEvents="box-none" style={dialogHostStyle}>
        <AppDialog
          open={policyOpen}
          title={AUTH_POLICY_STUB_TITLE}
          onClose={() => setPolicyOpen(false)}
        >
          <AppText role="bodySmall">{AUTH_POLICY_STUB_BODY}</AppText>
        </AppDialog>
        <AppDialog
          open={rulesOpen}
          title="Правила сервиса"
          onClose={() => setRulesOpen(false)}
        >
          {rulesText ? (
            <AppText role="bodySmall">{rulesText}</AppText>
          ) : rulesError ? (
            <AppText role="bodySmall" tone="danger">{rulesError}</AppText>
          ) : (
            <AppText role="bodySmall" tone="secondary">Загружаем правила…</AppText>
          )}
        </AppDialog>
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
  return (
    <View
      nativeID="nickname-suggestions"
      style={{ gap: designTokens.space.x2, width: '100%' }}
    >
      <AppText
        role="metadata"
        style={{
          color: designTokens.color.fieldLabel,
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
            onPress={() => onSelect(suggestion)}
          />
        ))}
      </View>
    </View>
  );
}

export function RegisterForm({ redirectTo = '/' }: AuthFormProps) {
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
  const rulesVersion = useRef<string | null>(null);
  const rulesRequest = useRef(0);
  const rulesPending = useRef(false);
  const sessionOperation = useRef(0);
  const nicknameAdvancePending = useRef(false);
  const nicknameAdvanceOperation = useRef(0);
  const seenAuthEpoch = useRef(authEpoch);
  const mounted = useRef(true);
  const completed = useRef(false);
  const createdAccountId = useRef<string | null>(null);
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
  const [rulesText, setRulesText] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
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
      rulesAccepted: false,
    },
  });
  const watched = form.watch();
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
    createdAccountId.current === null &&
    (sessionUser()?.id ?? null) === null &&
    currentAuthEpoch(queryClient) === epoch;
  const consentOwns = (operation: number, epoch: number) => {
    const owner = createdAccountId.current;
    return (
      routeOwns(operation) &&
      owner !== null &&
      (sessionUser()?.id ?? null) === owner &&
      currentAuthEpoch(queryClient) === epoch &&
      canWritePrivateCache(queryClient, epoch)
    );
  };
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
        watched.rulesAccepted,
    ),
    busy: form.formState.isSubmitting,
  });
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      registerTransport.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (!registerSnapshot.current || !registerTransport.current) return;
    const current = `${watched.email}\0${watched.slug}\0${watched.password}`;
    if (current !== registerSnapshot.current) registerTransport.current.abort();
  }, [watched.email, watched.password, watched.slug]);
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
    rulesVersion.current = null;
    if (!mounted.current) return;
    setRulesText(null);
    setRulesOpen(false);
    setPolicyOpen(false);
    const owner = createdAccountId.current;
    const sessionId =
      queryClient.getQueryData<User | null>(authKeys.session)?.id ?? null;
    if (owner && sessionId !== owner) {
      form.setValue('rulesAccepted', false);
      setSubmitError('Сессия изменилась. Согласие не перенесено.');
    }
  }, [authEpoch, form, invalidateSlugAvailability, queryClient]);

  useEffect(() => {
    if (trackedRegistrationStart.current) {
      return;
    }
    trackedRegistrationStart.current = true;
    analytics.track('registration_started', {});
  }, [analytics]);

  const clearShownRules = () => {
    rulesVersion.current = null;
    setRulesText(null);
    setRulesOpen(false);
    setPolicyOpen(false);
  };
  const openPolicy = () => setPolicyOpen(true);
  const openRulesDialog = () => {
    setRulesOpen(true);
    if (!rulesText && !rulesPending.current) loadRulesVersion();
  };
  const loadRulesVersion = () => {
    rulesVersion.current = null;
    setRulesText(null);
    const request = rulesRequest.current + 1;
    rulesRequest.current = request;
    const operation = sessionOperation.current;
    const epoch = currentAuthEpoch(queryClient);
    const created = createdAccountId.current;
    const allowed = created
      ? consentOwns(operation, epoch)
      : anonymousOwns(operation, epoch);
    if (!allowed) return;
    rulesPending.current = true;
    void api.auth
      .getRules()
      .then((response) => {
        const stillAllowed = created
          ? consentOwns(operation, epoch)
          : anonymousOwns(operation, epoch);
        if (rulesRequest.current !== request || !stillAllowed) return;
        rulesVersion.current = response.rules.version;
        setRulesText(response.rules.text);
        form.clearErrors('rulesAccepted');
      })
      .catch(() => {
        const stillAllowed = created
          ? consentOwns(operation, epoch)
          : anonymousOwns(operation, epoch);
        if (rulesRequest.current !== request || !stillAllowed) return;
        rulesVersion.current = null;
        setRulesText(null);
        form.setError('rulesAccepted', { message: 'Не удалось получить правила.' });
      })
      .finally(() => {
        if (rulesRequest.current === request) rulesPending.current = false;
      });
  };
  const submitRegistration = form.handleSubmit(async (values) => {
    setSubmitError(null);
    const operation = sessionOperation.current;
    const epoch = currentAuthEpoch(queryClient);
    if (createdAccountId.current) {
      if ((sessionUser()?.id ?? null) !== createdAccountId.current) {
        if (!routeOwns(operation)) return;
        clearShownRules();
        form.setValue('rulesAccepted', false);
        setSubmitError('Сессия изменилась. Согласие не перенесено.');
        return;
      }
      if (!consentOwns(operation, epoch)) return;
    } else if (!anonymousOwns(operation, epoch)) {
      return;
    }
    const version = rulesVersion.current;
    if (!version) {
      setSubmitError('Не удалось получить правила.');
      return;
    }
    if (!createdAccountId.current) {
      if (proofAvailability === 'unavailable') {
        setSubmitError(AUTH_TURNSTILE_UNAVAILABLE_COPY);
        return;
      }
      if (!proof) {
        setSubmitError(AUTH_TURNSTILE_REQUIRED_COPY);
        return;
      }
    }
    let consentEpoch = epoch;
    registerTransport.current?.abort();
    const controller = new AbortController();
    registerTransport.current = controller;
    registerSnapshot.current = `${values.email}\0${values.slug}\0${values.password}`;
    try {
      if (!createdAccountId.current) {
        const token = proof;
        if (!token) {
          setSubmitError(AUTH_TURNSTILE_REQUIRED_COPY);
          return;
        }
        setProof(null);
        setWidgetGeneration((generation) => generation + 1);
        const response = await auth.register(
          { ...registerSubmission(values), turnstileToken: token },
          { signal: controller.signal },
        );
        if (controller.signal.aborted || !mounted.current || !focusedRef.current) return;
        const sessionId = sessionUser()?.id ?? null;
        createdAccountId.current = response.user.id;
        const installedHere = sessionId === response.user.id;
        if (!installedHere || !routeOwns(operation)) {
          clearShownRules();
          if (mounted.current && !installedHere) {
            form.setValue('rulesAccepted', false);
            setSubmitError('Сессия изменилась. Согласие не перенесено.');
          }
          return;
        }
        consentEpoch = currentAuthEpoch(queryClient);
        analytics.identify(response.user.id, { claimAcquisition: true });
      }
      if (!consentOwns(operation, consentEpoch) || rulesVersion.current !== version) return;
      await api.auth.acceptRules({ rulesVersion: version });
      if (!consentOwns(operation, consentEpoch) || rulesVersion.current !== version) return;
      const refreshed = await auth.refreshSession();
      if (!consentOwns(operation, consentEpoch) || rulesVersion.current !== version) return;
      if (
        !refreshed ||
        refreshed.id !== createdAccountId.current ||
        refreshed.acceptedRulesVersion !== version
      ) {
        setSubmitError('Не удалось сохранить согласие. Повторите принятие правил.');
        return;
      }
      finishRegistration(refreshed, operation);
    } catch (error) {
      if (controller.signal.aborted || aborted(error)) {
        const sessionId = sessionUser()?.id ?? null;
        if (
          mounted.current &&
          focusedRef.current &&
          sessionId &&
          sessionId !== createdAccountId.current
        ) {
          clearShownRules();
          form.setValue('rulesAccepted', false);
          setSubmitError('Сессия изменилась. Согласие не перенесено.');
        }
        return;
      }
      if (!createdAccountId.current) {
        if (!anonymousOwns(operation, epoch)) return;
      } else if (!consentOwns(operation, consentEpoch)) {
        return;
      }
      if (createdAccountId.current) {
        if (error instanceof ApiClientError && error.kind === 'conflict') {
          clearShownRules();
          form.setValue('rulesAccepted', false);
          setStep('email');
          form.setError('rulesAccepted', {
            message: 'Правила изменились. Подтвердите согласие ещё раз.',
          });
          return;
        }
        setSubmitError('Не удалось сохранить согласие. Повторите принятие правил.');
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
    if (
      createdAccountId.current &&
      (sessionUser()?.id ?? null) !== createdAccountId.current
    ) {
      clearShownRules();
      form.setValue('rulesAccepted', false);
      setSubmitError('Сессия изменилась. Согласие не перенесено.');
      return;
    }
    setSubmitError(null);
    if (step === 'email') {
      const emailOk = await form.trigger('email');
      if (!form.getValues('rulesAccepted')) {
        form.setError('rulesAccepted', { message: 'Подтвердите согласие с правилами' });
        return;
      }
      if (!rulesVersion.current) {
        if (!rulesPending.current) {
          form.setError('rulesAccepted', { message: 'Не удалось получить правила.' });
        }
        return;
      }
      form.clearErrors('rulesAccepted');
      if (emailOk) setStep('nickname');
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
            color: designTokens.color.textSubdued,
            text: 'Проверяем никнейм…',
          }
        : slugAvailability.status === 'available'
          ? {
              color: designTokens.auth.available,
              text: `@${slugAvailability.slug} доступен`,
            }
          : slugAvailability.status === 'taken'
            ? {
                color: designTokens.auth.taken,
                text: `@${slugAvailability.slug} недоступен`,
              }
            : {
                color: designTokens.auth.taken,
                text: nicknameAvailabilityError(slugAvailability.error),
              }
      : null;
  const nextAction = (
    <PrimaryButton
      label="Дальше"
      width="full"
      loading={
        form.formState.isSubmitting ||
        slugAvailability?.status === 'checking'
      }
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
          <AppText role="sectionTitle" style={{ textAlign: 'center', color: designTokens.color.fieldValue, ...designTokens.typography.authScreenTitle }}>
            {copy.title}
          </AppText>
          <AppText role="bodySmall" style={{ textAlign: 'center', color: designTokens.color.textSubdued, ...designTokens.typography.authCaption, letterSpacing: 0 }}>
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
                    iconColor={designTokens.color.fieldIcon}
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
                  error={form.formState.errors.confirmPassword?.message}
                />
              )}
            />
            {createdAccountId.current ? null : (
              <TurnstileWidget
                key={widgetGeneration}
                action="register"
                onToken={onProof}
                onAvailability={onProofAvailability}
              />
            )}
          </>
        ) : null}
        {submitFeedback}
        {nextAction}
        {step === 'email' ? (
          <Controller
            control={form.control}
            name="rulesAccepted"
            render={({ field }) => {
              const rulesError = form.formState.errors.rulesAccepted?.message;
              return (
                <>
                  <AuthConsentCheckbox
                    checked={field.value}
                    onOpenPolicy={openPolicy}
                    onOpenRules={openRulesDialog}
                    onChange={(checked) => {
                      field.onChange(checked);
                      rulesRequest.current += 1;
                      rulesPending.current = false;
                      if (!checked) {
                        clearShownRules();
                        return;
                      }
                      if (!rulesVersion.current) loadRulesVersion();
                    }}
                    error={rulesError}
                  />
                  {field.value && rulesError === 'Не удалось получить правила.' ? (
                    <TextButton label="Повторить" onPress={loadRulesVersion} />
                  ) : null}
                  <View pointerEvents="box-none" style={dialogHostStyle}>
                  <AppDialog
                    open={policyOpen}
                    title={AUTH_POLICY_STUB_TITLE}
                    onClose={() => setPolicyOpen(false)}
                  >
                    <AppText role="bodySmall">{AUTH_POLICY_STUB_BODY}</AppText>
                  </AppDialog>
                  <AppDialog
                    open={rulesOpen}
                    title="Правила сервиса"
                    onClose={() => setRulesOpen(false)}
                  >
                    {rulesText ? (
                      <AppText role="bodySmall">{rulesText}</AppText>
                    ) : rulesError === 'Не удалось получить правила.' ? (
                      <AppText role="bodySmall" tone="danger">{rulesError}</AppText>
                    ) : (
                      <AppText role="bodySmall" tone="secondary">
                        Загружаем правила…
                      </AppText>
                    )}
                  </AppDialog>
                  </View>
                </>
              );
            }}
          />
        ) : null}
        </View>
        )}
      </View>
  );
}
