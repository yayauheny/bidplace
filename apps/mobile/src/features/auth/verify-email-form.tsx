import { useEffect, useRef, useState } from 'react';
import { useRouter, type Href } from 'expo-router';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

import { AppText, PrimaryButton, SecondaryButton, TextField } from '../../components/ui';
import { getErrorStatus, getUserFacingErrorMessage } from '../../errors';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';
import { type SafeRedirect } from './auth-redirect';
import { AuthCard } from './auth-card';

type VerifyEmailFormProps = { redirectTo: SafeRedirect; autoRequest: boolean };

function requestErrorMessage(error: unknown): string {
  if (getErrorStatus(error) === 409) {
    return 'Код уже отправлен. Попробуйте запросить новый немного позже.';
  }
  return getUserFacingErrorMessage(error, 'Не удалось отправить код.');
}

export function VerifyEmailForm({ redirectTo, autoRequest }: VerifyEmailFormProps) {
  const api = useApiClient();
  const auth = useAuth();
  const router = useRouter();
  const autoRequested = useRef(false);
  const [code, setCode] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestCode = async () => {
    setRequesting(true);
    setError(null);
    try {
      await api.auth.requestEmailVerification();
      setNotice('Код отправлен на вашу почту.');
    } catch (requestError) {
      setError(requestErrorMessage(requestError));
    } finally {
      setRequesting(false);
    }
  };

  useEffect(() => {
    if (!autoRequest || autoRequested.current || auth.user?.emailVerifiedAt) return;
    autoRequested.current = true;
    void requestCode();
  }, [auth.user?.emailVerifiedAt, autoRequest]);

  const verify = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError('Введите шестизначный код.');
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      await api.auth.verifyEmailVerification({ code });
      const user = await auth.refreshSession();
      if (!user?.emailVerifiedAt) {
        setError('Не удалось обновить статус подтверждения. Попробуйте ещё раз.');
        return;
      }
      router.replace(redirectTo as Href);
    } catch (verifyError) {
      setError(getUserFacingErrorMessage(verifyError, 'Не удалось подтвердить email.'));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <AuthCard
      title="Подтвердите email"
      description={`Подтвердите ${auth.user?.email ?? 'ваш email'}, чтобы создавать и редактировать профиль автора.`}
    >
      <View style={{ gap: designTokens.space.x3 }}>
        <TextField
          label="Код из письма"
          value={code}
          onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          error={error ?? undefined}
        />
        {notice ? <AppText role="bodySmall" tone="secondary">{notice}</AppText> : null}
        <PrimaryButton label="Подтвердить" width="full" loading={verifying} disabled={requesting} onPress={() => void verify()} />
        <SecondaryButton label={requesting ? 'Отправляем код…' : 'Отправить код'} width="full" disabled={verifying || requesting} onPress={() => void requestCode()} />
      </View>
    </AuthCard>
  );
}
