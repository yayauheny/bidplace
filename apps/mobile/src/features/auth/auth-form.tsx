import { Link, useRouter, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View } from 'react-native';
import { modernTokens } from '@bidplace/design-tokens';
import {
  AppText,
  PrimaryButton,
  TextButton,
  TextField,
} from '../../components/modern-ui';
import { useAuth } from '../../providers/auth-provider';
import { getUserFacingErrorMessage } from '../../lib/errors';
import {
  loginFormSchema,
  registerFormSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from './schemas';
import type { SafeRedirect } from './auth-redirect';

function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <View
      style={{
        width: '100%',
        maxWidth: 540,
        gap: modernTokens.space.x5,
        borderRadius: modernTokens.radius.panel,
        borderWidth: 1,
        borderColor: modernTokens.color.border,
        backgroundColor: modernTokens.color.surface,
        padding: modernTokens.space.x6,
      }}
    >
      <View style={{ gap: modernTokens.space.x2 }}>
        <AppText role="screenTitle">{title}</AppText>
        <AppText role="bodySmall" tone="secondary">
          {description}
        </AppText>
      </View>
      {children}
    </View>
  );
}
type AuthFormProps = { redirectTo?: SafeRedirect };
export function LoginForm({ redirectTo = '/' }: AuthFormProps) {
  const auth = useAuth();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });
  const submit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await auth.login(values);
      router.replace(redirectTo as Href);
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
          onPress={() => router.replace(redirectTo as Href)}
        />
      </AuthCard>
    );
  return (
    <AuthCard
      title="Вход"
      description="Войдите или создайте аккаунт, чтобы продолжить работу с аукционами."
    >
      <View style={{ gap: modernTokens.space.x3 }}>
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
        {submitError ? (
          <AppText role="bodySmall" tone="danger">
            {submitError}
          </AppText>
        ) : null}
        <PrimaryButton
          label="Войти"
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
          <TextButton
            label="Нет аккаунта? Создать аккаунт"
            onPress={() => undefined}
          />
        </Link>
      </View>
    </AuthCard>
  );
}
export function RegisterForm({ redirectTo = '/' }: AuthFormProps) {
  const auth = useAuth();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { email: '', password: '', phone: '', displayName: '' },
  });
  const submit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await auth.register(values);
      router.replace(redirectTo as Href);
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
          onPress={() => router.replace(redirectTo as Href)}
        />
      </AuthCard>
    );
  return (
    <AuthCard
      title="Регистрация"
      description="Создайте аккаунт, чтобы участвовать в торгах и при необходимости подать заявку продавца."
    >
      <View style={{ gap: modernTokens.space.x3 }}>
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
              error={form.formState.errors.phone?.message}
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
          <AppText role="bodySmall" tone="danger">
            {submitError}
          </AppText>
        ) : null}
        <PrimaryButton
          label="Создать аккаунт"
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
          <TextButton
            label="Уже есть аккаунт? Войти"
            onPress={() => undefined}
          />
        </Link>
      </View>
    </AuthCard>
  );
}
