import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import { ApiErrorCode } from '@bidplace/contracts';

import { AppText, PrimaryButton } from '../../components/ui';
import { FigmaButton } from '../../components/figma/FigmaButton';
import {
  applyFormFailure,
  getErrorCode,
  getUserFacingErrorMessage,
  readFormFailure,
} from '../../errors';
import { useApiClient } from '../../providers/api-provider';
import { AuthPasswordField } from './auth-password-field';
import { useAuthSheetGuard } from './auth-sheet-context';
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
  const watched = form.watch();
  useAuthSheetGuard({
    dirty: Boolean(watched.password || watched.confirmPassword) && !submitted,
    busy: form.formState.isSubmitting,
  });

  if (!token?.trim()) {
    return (
      <View style={{ gap: designTokens.auth.formGap }}>
        <AppText role="bodySmall">
          Откройте ссылку из письма или запросите восстановление пароля заново.
        </AppText>
        <Link href="/forgot-password" asChild>
          <FigmaButton label="Запросить новую ссылку" variant="authQuiet" size="auth" width="full" onPress={() => undefined} />
        </Link>
      </View>
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
      <View style={{ gap: designTokens.auth.formGap }}>
        <AppText role="sectionTitle">Пароль обновлён</AppText>
        <AppText role="bodySmall">{RESET_PASSWORD_SUCCESS_DESCRIPTION}</AppText>
        <PrimaryButton
          label="Перейти ко входу"
          size="auth"
          width="full"
          onPress={() => router.replace('/login')}
        />
      </View>
    );
  }

  return (
      <View style={{ gap: designTokens.auth.formGap }}>
        <AppText role="bodySmall">Придумайте новый пароль для входа в аккаунт.</AppText>
        <Controller
          control={form.control}
          name="password"
          render={({ field }) => (
            <AuthPasswordField
              label="Новый пароль"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              autoComplete="new-password"
              metrics="authPassword"
              error={form.formState.errors.password?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <AuthPasswordField
              label="Подтверждение пароля"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              autoComplete="new-password"
              metrics="authPassword"
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
          size="auth"
          width="full"
          loading={form.formState.isSubmitting}
          onPress={submit}
        />
        <Link href="/forgot-password" asChild>
          <FigmaButton label="Запросить новую ссылку" variant="authQuiet" size="auth" width="full" onPress={() => undefined} />
        </Link>
      </View>
  );
}
