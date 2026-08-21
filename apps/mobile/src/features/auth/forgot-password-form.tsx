import { Link, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

import { AppText, PrimaryButton, TextButton, TextField } from '../../components/ui';
import { getUserFacingErrorMessage } from '../../lib/errors';
import { useApiClient } from '../../providers/api-provider';
import type { SafeRedirect } from './auth-redirect';
import { AuthCard } from './auth-card';
import { forgotPasswordFormSchema, type ForgotPasswordFormValues } from './schemas';

type ForgotPasswordFormProps = { redirectTo?: SafeRedirect };

function loginHref(redirectTo: SafeRedirect) {
  return {
    pathname: '/login' as const,
    params: redirectTo !== '/' ? { redirectTo } : undefined,
  };
}

export function ForgotPasswordForm({ redirectTo = '/' }: ForgotPasswordFormProps) {
  const api = useApiClient();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: '' },
  });

  const submit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await api.auth.forgotPassword(values);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        getUserFacingErrorMessage(error, 'Не удалось отправить запрос'),
      );
    }
  });

  if (submitted) {
    return (
      <AuthCard
        title="Проверьте почту"
        description="Если аккаунт с таким email существует, мы отправили ссылку для сброса пароля."
      >
        <PrimaryButton
          label="Вернуться ко входу"
          onPress={() => router.replace(loginHref(redirectTo) as Href)}
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Восстановление пароля"
      description="Введите email аккаунта. Мы отправим ссылку для создания нового пароля."
    >
      <View style={{ gap: designTokens.space.x3 }}>
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
        {submitError ? (
          <AppText role="bodySmall" tone="danger" accessibilityLiveRegion="polite">
            {submitError}
          </AppText>
        ) : null}
        <PrimaryButton
          label="Отправить ссылку"
          loading={form.formState.isSubmitting}
          onPress={submit}
        />
        <Link href={loginHref(redirectTo)} asChild>
          <TextButton label="Вернуться ко входу" onPress={() => undefined} />
        </Link>
      </View>
    </AuthCard>
  );
}
