'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { PrimaryButton, TextField } from '../../components/ui/controls';
import { Heading, Text } from '../../components/ui/layout';
import { Card } from '../../components/ui/surfaces';
import { spacing } from '../../theme/tokens';
import { useAuth } from '../../providers/auth-provider';
import {
  type LoginFormValues,
  type RegisterFormValues,
  loginFormSchema,
  registerFormSchema,
} from './schemas';
import { YStack } from '../../components/ui/stack';

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
    <Card>
      <YStack gap={spacing[2]}>
        <Heading level="h2">{title}</Heading>
        <Text tone="muted">{description}</Text>
      </YStack>
      {children}
    </Card>
  );
}

function useRedirectAfterAuth(redirectTo: string) {
  const router = useRouter();

  return () => {
    router.replace(redirectTo);
  };
}

export function LoginForm({ redirectTo = '/' }: { redirectTo?: string }) {
  const auth = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const redirect = useRedirectAfterAuth(redirectTo);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  if (!auth.ready) {
    return <Text tone="muted">Подготавливаем форму...</Text>;
  }

  if (auth.isAuthenticated) {
    return (
      <AuthCard
        title="Вы уже вошли"
        description="Если нужно, выйдите из текущей сессии и попробуйте снова."
      >
        <PrimaryButton onPress={redirect}>Перейти на главную</PrimaryButton>
      </AuthCard>
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      await auth.login(values);
      redirect();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Не удалось войти');
    }
  });

  return (
    <AuthCard
      title="Вход"
      description="Используйте email и пароль для доступа к seller и admin зонам."
    >
      <YStack gap={spacing[3]}>
        <TextField
          label="Email"
          placeholder="name@example.com"
          autoComplete="email"
          {...form.register('email')}
          error={form.formState.errors.email?.message}
        />
        <TextField
          label="Пароль"
          placeholder="••••••••"
          autoComplete="current-password"
          type="password"
          {...form.register('password')}
          error={form.formState.errors.password?.message}
        />
        {submitError ? <Text tone="danger">{submitError}</Text> : null}
        <PrimaryButton
          onPress={onSubmit}
          isLoading={form.formState.isSubmitting}
          loadingLabel="Входим"
        >
          Войти
        </PrimaryButton>
      </YStack>
    </AuthCard>
  );
}

export function RegisterForm({ redirectTo = '/' }: { redirectTo?: string }) {
  const auth = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const redirect = useRedirectAfterAuth(redirectTo);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: '',
      password: '',
      phone: '',
      displayName: '',
    },
  });

  if (!auth.ready) {
    return <Text tone="muted">Подготавливаем форму...</Text>;
  }

  if (auth.isAuthenticated) {
    return (
      <AuthCard
        title="Вы уже вошли"
        description="Если нужно, выйдите из текущей сессии и попробуйте снова."
      >
        <PrimaryButton onPress={redirect}>Перейти на главную</PrimaryButton>
      </AuthCard>
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      await auth.register(values);
      redirect();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Не удалось зарегистрироваться',
      );
    }
  });

  return (
    <AuthCard
      title="Регистрация"
      description="Создайте аккаунт, чтобы открыть seller и admin сценарии."
    >
      <YStack gap={spacing[3]}>
        <TextField
          label="Имя"
          placeholder="Иван Иванов"
          autoComplete="name"
          {...form.register('displayName')}
          error={form.formState.errors.displayName?.message}
        />
        <TextField
          label="Email"
          placeholder="name@example.com"
          autoComplete="email"
          {...form.register('email')}
          error={form.formState.errors.email?.message}
        />
        <TextField
          label="Телефон"
          placeholder="+375..."
          autoComplete="tel"
          {...form.register('phone')}
          error={form.formState.errors.phone?.message}
        />
        <TextField
          label="Пароль"
          placeholder="••••••••"
          autoComplete="new-password"
          type="password"
          {...form.register('password')}
          error={form.formState.errors.password?.message}
        />
        {submitError ? <Text tone="danger">{submitError}</Text> : null}
        <PrimaryButton
          onPress={onSubmit}
          isLoading={form.formState.isSubmitting}
          loadingLabel="Создаём аккаунт"
        >
          Создать аккаунт
        </PrimaryButton>
      </YStack>
    </AuthCard>
  );
}
