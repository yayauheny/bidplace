import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import { ApiErrorCode } from '@bidplace/contracts';

import { AppText, PrimaryButton, TextButton, TextField } from '../../components/ui';
import {
  applyFormFailure,
  getErrorCode,
  getUserFacingErrorMessage,
  readFormFailure,
} from '../../errors';
import { useApiClient } from '../../providers/api-provider';
import { AuthCard } from './auth-card';
import { resetPasswordFormSchema, type ResetPasswordFormValues } from './schemas';
import { RESET_PASSWORD_SUCCESS_DESCRIPTION } from '../../lib/portfolio-copy';

export function ResetPasswordForm({ token }: { token: string | null }) {
  const api = useApiClient();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  if (!token?.trim()) {
    return (
      <AuthCard
        title="Ссылка недействительна"
        description="Откройте ссылку из письма или запросите восстановление пароля заново."
      >
        <Link href="/forgot-password" asChild>
          <TextButton label="Запросить новую ссылку" onPress={() => undefined} />
        </Link>
      </AuthCard>
    );
  }

  const submit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await api.auth.resetPassword({
        token: token.trim(),
        password: values.password,
      });
      setSubmitted(true);
    } catch (error) {
      const code = getErrorCode(error);
      if (code === ApiErrorCode.PASSWORD_RESET_INVALID) {
        setSubmitError('Ссылка недействительна или устарела. Запросите новую.');
        return;
      }

      const failure = readFormFailure(error, ['password']);
      if (failure.disposition === 'passthrough') {
        setSubmitError(getUserFacingErrorMessage(error, 'Не удалось обновить пароль'));
        return;
      }
      applyFormFailure(form, failure, ['password', 'confirmPassword']);
      setSubmitError(failure.formMessage);
    }
  });

  if (submitted) {
    return (
      <AuthCard
        title="Пароль обновлён"
        description={RESET_PASSWORD_SUCCESS_DESCRIPTION}
      >
        <PrimaryButton
          label="Перейти ко входу"
          width="full"
          onPress={() => router.replace('/login')}
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Новый пароль"
      description="Придумайте новый пароль для входа в аккаунт."
    >
      <View style={{ gap: designTokens.space.x3 }}>
        <Controller
          control={form.control}
          name="password"
          render={({ field }) => (
            <TextField ref={field.ref}
              label="Новый пароль"
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
        <Controller
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <TextField ref={field.ref}
              label="Подтверждение пароля"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="••••••••"
              autoComplete="new-password"
              secureTextEntry
              error={form.formState.errors.confirmPassword?.message}
            />
          )}
        />
        {submitError ? (
          <AppText role="bodySmall" tone="danger" accessibilityLiveRegion="polite">
            {submitError}
          </AppText>
        ) : null}
        <PrimaryButton
          label="Сохранить пароль"
          width="full"
          loading={form.formState.isSubmitting}
          onPress={submit}
        />
        <Link href="/forgot-password" asChild>
          <TextButton label="Запросить новую ссылку" onPress={() => undefined} />
        </Link>
      </View>
    </AuthCard>
  );
}
