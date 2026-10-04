import { Link, useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import { AppText, PrimaryButton, TextField } from '../../components/ui';
import { FigmaButton } from '../../components/figma/FigmaButton';
import { MotionPressable } from '../../components/ui/MotionPressable';
import { useAnalytics } from '../../providers/analytics-provider';
import { useAuth } from '../../providers/auth-provider';
import { getUserFacingErrorMessage } from '../../errors';
import {
  loginFormSchema,
  registerFormSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from './schemas';
import type { SafeRedirect } from './auth-redirect';
import { AuthCard } from './auth-card';
type AuthFormProps = { redirectTo?: SafeRedirect };
export function LoginForm({ redirectTo = '/' }: AuthFormProps) {
  const auth = useAuth();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });
  useEffect(() => {
    if (form.formState.isSubmitSuccessful && auth.isAuthenticated) {
      router.replace(redirectTo as Href);
    }
  }, [
    auth.isAuthenticated,
    form.formState.isSubmitSuccessful,
    redirectTo,
    router,
  ]);
  const submit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await auth.login(values);
    } catch (error) {
      setSubmitError(getUserFacingErrorMessage(error, 'Не удалось войти'));
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
      <AuthCard title="Вы уже вошли" description="Перейдите к следующему шагу.">
        <PrimaryButton
          label="Перейти дальше"
          width="full"
          onPress={() => router.replace(redirectTo as Href)}
        />
      </AuthCard>
    );
  return (
    <AuthCard title="Вход на Bidplace">
      <View style={{ gap: designTokens.space.identityGap }}>
        <Controller
          control={form.control}
          name="email"
          render={({ field }) => (
            <TextField
              label="Email"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="name@example.com"
              autoComplete="email"
              keyboardType="email-address"
              error={form.formState.errors.email?.message}
            />
          )}
        />
        <View style={{ gap: designTokens.space.authorIdentityGap }}>
          <Controller
            control={form.control}
            name="password"
            render={({ field }) => (
              <TextField
                label="Пароль"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="••••••••"
                autoComplete="current-password"
                secureTextEntry
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
            >
              <AppText role="fieldError">Забыли пароль?</AppText>
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
            variant="outline"
            width="full"
            onPress={() => undefined}
          />
        </Link>
      </View>
    </AuthCard>
  );
}
export function RegisterForm({ redirectTo = '/' }: AuthFormProps) {
  const auth = useAuth();
  const analytics = useAnalytics();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const trackedRegistrationStart = useRef(false);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { email: '', password: '', phone: '', displayName: '' },
  });
  useEffect(() => {
    if (form.formState.isSubmitSuccessful && auth.isAuthenticated) {
      router.replace(redirectTo as Href);
    }
  }, [
    auth.isAuthenticated,
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
    try {
      const response = await auth.register(values);
      analytics.identify(response.user.id, { claimAcquisition: true });
    } catch (error) {
      setSubmitError(
        getUserFacingErrorMessage(error, 'Не удалось зарегистрироваться'),
      );
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
      <AuthCard title="Вы уже вошли" description="Перейдите к следующему шагу.">
        <PrimaryButton
          label="Перейти дальше"
          width="full"
          onPress={() => router.replace(redirectTo as Href)}
        />
      </AuthCard>
    );
  return (
    <AuthCard title="Регистрация">
      <View style={{ gap: designTokens.space.x3 }}>
        <Controller
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <TextField
              label="Имя"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Иван Иванов"
              autoComplete="name"
              error={form.formState.errors.displayName?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="email"
          render={({ field }) => (
            <TextField
              label="Email"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="name@example.com"
              autoComplete="email"
              keyboardType="email-address"
              error={form.formState.errors.email?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="phone"
          render={({ field }) => (
            <TextField
              label="Телефон"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="+375..."
              autoComplete="tel"
              keyboardType="phone-pad"
              error={
                form.formState.errors.phone ? 'Введите телефон' : undefined
              }
            />
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field }) => (
            <TextField
              label="Пароль"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="••••••••"
              autoComplete="new-password"
              secureTextEntry
              error={form.formState.errors.password?.message}
            />
          )}
        />
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
          label="Создать аккаунт"
          width="full"
          loading={form.formState.isSubmitting}
          onPress={submit}
        />
        <Link
          href={{
            pathname: '/login',
            params: redirectTo !== '/' ? { redirectTo } : undefined,
          }}
          asChild
        >
          <FigmaButton
            label="Войти"
            variant="outline"
            width="full"
            onPress={() => undefined}
          />
        </Link>
      </View>
    </AuthCard>
  );
}
