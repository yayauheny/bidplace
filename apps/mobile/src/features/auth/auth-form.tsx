import { Link, useRouter, type Href } from 'expo-router';
import type { SafeRedirect } from './auth-redirect';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { BrandLogo } from '../../components/layout/BrandLogo';
import { AppButton, AppCard, ControlledAppInput } from '../../components/ui';
import { mobileSpacing } from '../../theme/tokens';
import { useAuth } from '../../providers/auth-provider';
import {
  loginFormSchema,
  registerFormSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from './schemas';
import { Text, YStack } from 'tamagui';
import { useAppThemePalette } from '../../theme/palette';
import { getUserFacingErrorMessage } from '../../lib/errors';

function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const palette = useAppThemePalette();
  return (
    <AppCard style={{ width: '100%', maxWidth: 540, alignSelf: 'center' }}>
      <YStack style={{ gap: mobileSpacing[4], alignItems: 'center' }}>
        <BrandLogo />
        <YStack style={{ gap: mobileSpacing[2], alignItems: 'center' }}>
          <Text style={{ fontSize: 24, lineHeight: 30, fontWeight: '700', color: palette.color }}>
            {title}
          </Text>
          <Text
            style={{
              fontSize: 14,
              lineHeight: 20,
              color: palette.colorMuted,
              textAlign: 'center',
            }}
          >
            {description}
          </Text>
        </YStack>
      </YStack>
      <YStack style={{ gap: mobileSpacing[4] }}>{children}</YStack>
    </AppCard>
  );
}

type AuthFormProps = {
  redirectTo?: SafeRedirect;
};

export function LoginForm({ redirectTo = '/' }: AuthFormProps) {
  const auth = useAuth();
  const router = useRouter();
  const palette = useAppThemePalette();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      await auth.login(values);
      router.replace(redirectTo as Href);
    } catch (error) {
      setSubmitError(getUserFacingErrorMessage(error, 'Не удалось войти'));
    }
  });

  if (!auth.ready) {
    return <Text style={{ color: palette.colorMuted }}>Подготавливаем форму...</Text>;
  }

  if (auth.isAuthenticated) {
    return (
      <AuthCard
        title="Вы уже вошли"
        description="Если нужно, выйдите из текущей сессии и попробуйте снова."
      >
        <AppButton onPress={() => router.replace(redirectTo as Href)}>Перейти дальше</AppButton>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Вход"
      description="Войдите или создайте аккаунт, чтобы продолжить работу с аукционами."
    >
      <YStack style={{ gap: mobileSpacing[3] }}>
        <ControlledAppInput
          control={form.control}
          name="email"
          label="Email"
          placeholder="name@example.com"
          autoComplete="email"
          keyboardType="email-address"
          error={form.formState.errors.email?.message}
        />
        <ControlledAppInput
          control={form.control}
          name="password"
          label="Пароль"
          placeholder="••••••••"
          autoComplete="current-password"
          secureTextEntry
          error={form.formState.errors.password?.message}
        />
        {submitError ? (
          <Text style={{ color: palette.negative, fontSize: 14, lineHeight: 20 }}>{submitError}</Text>
        ) : null}
        <AppButton
          onPress={onSubmit}
          isLoading={form.formState.isSubmitting}
          loadingLabel="Входим"
          buttonSize="large"
        >
          Войти
        </AppButton>
        <Link
          href={{
            pathname: '/register',
            params: redirectTo !== '/' ? { redirectTo } : undefined,
          }}
          style={{
            color: palette.color,
            fontSize: 14,
            fontWeight: '600',
            textAlign: 'center',
            paddingTop: mobileSpacing[2],
            paddingBottom: mobileSpacing[2],
          }}
        >
          Нет аккаунта? Создать аккаунт
        </Link>
      </YStack>
    </AuthCard>
  );
}

export function RegisterForm({ redirectTo = '/' }: AuthFormProps) {
  const auth = useAuth();
  const router = useRouter();
  const palette = useAppThemePalette();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: '',
      password: '',
      phone: '',
      displayName: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
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

  if (!auth.ready) {
    return <Text style={{ color: palette.colorMuted }}>Подготавливаем форму...</Text>;
  }

  if (auth.isAuthenticated) {
    return (
      <AuthCard
        title="Вы уже вошли"
        description="Если нужно, выйдите из текущей сессии и попробуйте снова."
      >
        <AppButton onPress={() => router.replace(redirectTo as Href)}>Перейти дальше</AppButton>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Регистрация"
      description="Создайте аккаунт, чтобы открыть seller- и admin-сценарии."
    >
      <YStack style={{ gap: mobileSpacing[3] }}>
        <ControlledAppInput
          control={form.control}
          name="displayName"
          label="Имя"
          placeholder="Иван Иванов"
          autoComplete="name"
          error={form.formState.errors.displayName?.message}
        />
        <ControlledAppInput
          control={form.control}
          name="email"
          label="Email"
          placeholder="name@example.com"
          autoComplete="email"
          keyboardType="email-address"
          error={form.formState.errors.email?.message}
        />
        <ControlledAppInput
          control={form.control}
          name="phone"
          label="Телефон"
          placeholder="+375..."
          autoComplete="tel"
          keyboardType="phone-pad"
          error={form.formState.errors.phone?.message}
        />
        <ControlledAppInput
          control={form.control}
          name="password"
          label="Пароль"
          placeholder="••••••••"
          autoComplete="new-password"
          secureTextEntry
          error={form.formState.errors.password?.message}
        />
        {submitError ? (
          <Text style={{ color: palette.negative, fontSize: 14, lineHeight: 20 }}>{submitError}</Text>
        ) : null}
        <AppButton
          onPress={onSubmit}
          isLoading={form.formState.isSubmitting}
          loadingLabel="Создаём аккаунт"
          buttonSize="large"
        >
          Создать аккаунт
        </AppButton>
        <Link
          href={{
            pathname: '/login',
            params: redirectTo !== '/' ? { redirectTo } : undefined,
          }}
          style={{
            color: palette.color,
            fontSize: 14,
            fontWeight: '600',
            textAlign: 'center',
            paddingTop: mobileSpacing[2],
            paddingBottom: mobileSpacing[2],
          }}
        >
          Уже есть аккаунт? Войти
        </Link>
      </YStack>
    </AuthCard>
  );
}
