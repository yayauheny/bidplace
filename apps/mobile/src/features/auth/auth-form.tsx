import { Link, useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import { AppText, PrimaryButton, TextField } from '../../components/ui';
import { FigmaButton } from '../../components/figma/FigmaButton';
import { MotionPressable } from '../../components/ui/MotionPressable';
import { AuthPasswordField } from './auth-password-field';
import { registerSubmission } from './auth-dismissal';
import { useAuthSheetComplete, useAuthSheetGuard } from './auth-sheet-context';
import { AuthTelegramIcon } from './auth-telegram-icon';
import { useAnalytics } from '../../providers/analytics-provider';
import { useAuth } from '../../providers/auth-provider';
import { ApiClientError } from '@bidplace/api-client';

import {
  applyFormFailure,
  getUserFacingErrorMessage,
  readFormFailure,
} from '../../errors';
import {
  loginFormSchema,
  registerFormSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from './schemas';
import type { SafeRedirect } from './auth-redirect';
type AuthFormProps = { redirectTo?: SafeRedirect };
export function LoginForm({ redirectTo = '/' }: AuthFormProps) {
  const auth = useAuth();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [providerNotice, setProviderNotice] = useState<string | null>(null);
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
        <View style={{ gap: designTokens.space.x2 }}>
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
        <AppText role="bodySmall" style={{ textAlign: 'center', color: designTokens.color.textSubdued }}>
          или
        </AppText>
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
          variant="authProvider"
          size="auth"
          width="full"
          onPress={() => setProviderNotice('Вход через Google пока недоступен')}
        />
        <AppText role="bodySmall" style={{ color: designTokens.color.textSubdued }}>
          Продолжая, вы принимаете политику конфиденциальности и правила сервиса
        </AppText>
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
  const analytics = useAnalytics();
  const router = useRouter();
  const [step, setStep] = useState<RegistrationStep>('email');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const trackedRegistrationStart = useRef(false);
  const created = useRef(false);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { email: '', slug: '', password: '', confirmPassword: '', phone: '' },
  });
  const watched = form.watch();
  const complete = useAuthSheetComplete();
  const continueRegistration = () => {
    const next = auth.user?.emailVerifiedAt
      ? redirectTo
      : (`/verify-email?redirectTo=${encodeURIComponent(redirectTo)}` as SafeRedirect);
    if (complete) complete(next);
    else router.replace(next as Href);
  };
  useAuthSheetGuard({
    dirty: Boolean(watched.slug || watched.email || watched.password || watched.confirmPassword),
    busy: form.formState.isSubmitting,
  });
  useEffect(() => {
    if (form.formState.isSubmitSuccessful && auth.isAuthenticated) {
      continueRegistration();
    }
  }, [
    auth.isAuthenticated,
    complete,
    form.formState.isSubmitSuccessful,
    redirectTo,
    router,
  ]);

  useEffect(() => {
    if (trackedRegistrationStart.current) {
      return;
    }
    trackedRegistrationStart.current = true;
    analytics.track('registration_started', {});
  }, [analytics]);

  const submit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    if (created.current) {
      continueRegistration();
      return;
    }
    try {
      const response = await auth.register(registerSubmission(values));
      created.current = true;
      analytics.identify(response.user.id, { claimAcquisition: true });
    } catch (error) {
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
    setSubmitError(null);
    if (step === 'email') {
      if (await form.trigger('email')) setStep('nickname');
      return;
    }
    if (step === 'nickname') {
      if (await form.trigger('slug')) setStep('password');
      return;
    }
    await submit();
  };
  if (!auth.ready)
    return (
      <AppText role="bodySmall" tone="secondary">
        Подготавливаем форму…
      </AppText>
    );
  if (auth.isAuthenticated)
    return (
      <View style={{ gap: designTokens.auth.screenGap }}>
        <AppText role="bodySmall">Перейдите к следующему шагу.</AppText>
        <PrimaryButton
          label="Дальше"
          size="auth"
          width="full"
          onPress={continueRegistration}
        />
      </View>
    );
  const copy = registrationCopy[step];
  return (
      <View style={{ gap: designTokens.auth.screenGap, width: '100%' }}>
        <View style={{ gap: designTokens.space.x2 }}>
          <AppText role="sectionTitle" style={{ textAlign: 'center', color: designTokens.color.fieldValue, fontSize: 20, lineHeight: 22, fontWeight: '600' }}>
            {copy.title}
          </AppText>
          <AppText role="bodySmall" style={{ textAlign: 'center', color: designTokens.color.textSubdued, fontSize: 14, lineHeight: 20 }}>
            {copy.caption}
          </AppText>
        </View>
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
                value={field.value}
                onChangeText={field.onChange}
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
          <AppText role="bodySmall" style={{ textAlign: 'center', color: designTokens.color.textSubdued }}>
            Я соглашаюсь с политикой конфиденциальности и правилами сервиса
          </AppText>
        ) : null}
      </View>
  );
}
