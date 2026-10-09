import { Link, useIsFocused, useNavigation, useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { View, type ViewStyle } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import type { User } from '@bidplace/contracts';
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
import { useSlugAvailability } from './use-slug-availability';
import { ApiClientError } from '@bidplace/api-client';

import {
  applyFormFailure,
  getUserFacingErrorMessage,
  readFormFailure,
} from '../../errors';
import {
  authKeys,
  canWritePrivateCache,
  currentAuthEpoch,
} from '../../lib/query-cache';
import { usePrivateCacheEpoch } from '../../lib/use-private-cache-epoch';
import {
  loginFormSchema,
  registerFormSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from './schemas';
import type { SafeRedirect } from './auth-redirect';

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
  const [submitError, setSubmitError] = useState<string | null>(null);
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
  const complete = useAuthSheetComplete();
  useAuthSheetGuard({
    dirty: Boolean(emailValue || passwordValue),
    busy: form.formState.isSubmitting,
  });
  useEffect(() => {
    if (form.formState.isSubmitSuccessful && auth.isAuthenticated) {
      if (complete) complete(redirectTo);
      else router.replace(redirectTo as Href);
    }
  }, [
    auth.isAuthenticated,
    complete,
    form.formState.isSubmitSuccessful,
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
  const submit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await auth.login(values);
    } catch (error) {
      if (error instanceof ApiClientError && error.kind === 'unauthorized') {
        setSubmitError('Неверный email или пароль.');
        return;
      }
      const failure = readFormFailure(error, ['email', 'password']);
      if (failure.disposition === 'passthrough') {
        setSubmitError(getUserFacingErrorMessage(error, 'Не удалось войти'));
        return;
      }
      applyFormFailure(form, failure, ['email', 'password']);
      setSubmitError(failure.formMessage);
    }
  });
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
        <Link
          href={{
            pathname: '/register',
            params: redirectTo !== '/' ? { redirectTo } : undefined,
          }}
          asChild
        >
          <FigmaButton
            label="Регистрация"
            variant="authQuiet"
            size="auth"
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
          variant="authProvider"
          size="auth"
          width="full"
          onPress={() => setProviderNotice('Вход через Telegram пока недоступен')}
        />
        <FigmaButton
          label="Войти с Google"
          iconNode={<AuthGoogleIcon />}
          variant="authProvider"
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
  const seenAuthEpoch = useRef(authEpoch);
  const mounted = useRef(true);
  const completed = useRef(false);
  const createdAccountId = useRef<string | null>(null);
  const focused = useIsFocused();
  const navigation = useNavigation();
  const focusedRef = useRef(focused);
  const wasFocused = useRef(focused);
  const [rulesText, setRulesText] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
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
  const slugStatus = useSlugAvailability(step === 'nickname' ? watched.slug : '');
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
    };
  }, []);
  useEffect(() => {
    const markBlurred = () => {
      focusedRef.current = false;
      sessionOperation.current += 1;
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
  }, [navigation]);
  useEffect(() => {
    if (wasFocused.current && !focused) {
      focusedRef.current = false;
      sessionOperation.current += 1;
    }
    if (focused) focusedRef.current = true;
    wasFocused.current = focused;
  }, [focused]);
  useEffect(() => {
    if (seenAuthEpoch.current === authEpoch) return;
    seenAuthEpoch.current = authEpoch;
    if (registerSessionChangeIsOwn(queryClient, authEpoch)) return;
    sessionOperation.current += 1;
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
  }, [authEpoch, form, queryClient]);

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
  const submit = form.handleSubmit(async (values) => {
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
    let consentEpoch = epoch;
    try {
      if (!createdAccountId.current) {
        const response = await auth.register(registerSubmission(values));
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
      const failure = readFormFailure(error, ['email', 'slug', 'password', 'phone']);
      if (failure.disposition === 'passthrough') {
        setSubmitError(getUserFacingErrorMessage(error, 'Не удалось зарегистрироваться'));
        return;
      }
      applyFormFailure(form, failure, ['email', 'slug', 'password', 'phone']);
      if (failure.fields.slug) setStep('nickname');
      if (failure.fields.email) setStep('email');
      setSubmitError(failure.formMessage);
    }
  });
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
      if (await form.trigger('slug')) setStep('password');
      return;
    }
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
  return (
      <View style={{ gap: designTokens.auth.screenGap, width: '100%' }}>
        <View style={{ gap: designTokens.auth.titleGap }}>
          <AppText role="sectionTitle" style={{ textAlign: 'center', color: designTokens.color.fieldValue, ...designTokens.typography.authScreenTitle }}>
            {copy.title}
          </AppText>
          <AppText role="bodySmall" style={{ textAlign: 'center', color: designTokens.color.textSubdued, ...designTokens.typography.authCaption, letterSpacing: 0 }}>
            {copy.caption}
          </AppText>
          {step === 'nickname' && slugStatus && !form.formState.errors.slug ? (
            <AppText
              role="authStatus"
              style={{
                textAlign: 'center',
                color: slugStatus === 'available'
                  ? designTokens.auth.available
                  : designTokens.auth.taken,
              }}
            >
              {slugStatus === 'available' ? 'Никнейм свободен' : 'Никнейм занят'}
            </AppText>
          ) : null}
        </View>
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
        {step === 'nickname' ? (
          <Controller
            control={form.control}
            name="slug"
            render={({ field }) => (
              <TextField ref={field.ref}
                label="Никнейм"
                prefix="@"
                value={field.value}
                onChangeText={(value) => field.onChange(value.replace(/^@+/, ''))}
                onBlur={field.onBlur}
                placeholder="Никнейм"
                autoCapitalize="none"
                autoComplete="username"
                error={form.formState.errors.slug?.message}
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
          </>
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
        <PrimaryButton
          label="Дальше"
          size="auth"
          width="full"
          loading={form.formState.isSubmitting}
          onPress={() => void goNext()}
        />
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
      </View>
  );
}
