import { Link, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

import { AppText, PrimaryButton, TextField } from '../../components/ui';
import { FigmaButton } from '../../components/figma/FigmaButton';
import {
  applyFormFailure,
  getUserFacingErrorMessage,
  readFormFailure,
} from '../../errors';
import { useApiClient } from '../../providers/api-provider';
import type { SafeRedirect } from './auth-redirect';
import { useAuthSheetGuard } from './auth-sheet-context';
import { maskEmail } from './mask-email';
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
  const emailValue = form.watch('email');
  useAuthSheetGuard({
    dirty: Boolean(emailValue) && !submitted,
    busy: form.formState.isSubmitting,
  });

  const submit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await api.auth.forgotPassword(values);
      setSubmitted(true);
    } catch (error) {
      const failure = readFormFailure(error, ['email']);
      if (failure.disposition === 'passthrough') {
        setSubmitError(getUserFacingErrorMessage(error, 'Не удалось отправить запрос'));
        return;
      }
      applyFormFailure(form, failure, ['email']);
      setSubmitError(failure.formMessage);
    }
  });

  if (submitted) {
    return (
      <View style={{ gap: designTokens.auth.formGap }}>
        <AppText role="bodySmall">
          {`Если аккаунт с email ${maskEmail(form.getValues('email'))} существует, мы отправили ссылку для создания нового пароля.`}
        </AppText>
        <PrimaryButton
          label="Вернуться ко входу"
          size="auth"
          width="full"
          onPress={() => router.replace(loginHref(redirectTo) as Href)}
        />
      </View>
    );
  }

  return (
      <View style={{ gap: designTokens.auth.formGap }}>
        <AppText role="bodySmall">
          Введите email аккаунта. Мы отправим ссылку для создания нового пароля.
        </AppText>
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
        {submitError ? (
          <AppText role="bodySmall" tone="danger" accessibilityLiveRegion="polite">
            {submitError}
          </AppText>
        ) : null}
        <PrimaryButton
          label="Отправить ссылку"
          size="auth"
          width="full"
          loading={form.formState.isSubmitting}
          onPress={submit}
        />
        <Link href={loginHref(redirectTo)} asChild>
          <FigmaButton label="Вернуться ко входу" variant="authQuiet" size="auth" width="full" onPress={() => undefined} />
        </Link>
      </View>
  );
}
