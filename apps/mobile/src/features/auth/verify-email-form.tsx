import { useEffect, useRef, useState } from 'react';
import { useRouter, type Href } from 'expo-router';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

import { AppText, PrimaryButton, SecondaryButton, TextField } from '../../components/ui';
import { getErrorStatus, getUserFacingErrorMessage } from '../../errors';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';
import { type SafeRedirect } from './auth-redirect';
import { useAccountLogout } from './account-logout';
import { AccountLogoutButton } from './AccountLogoutButton';
import { AuthCard } from './auth-card';
import {
  emailVerificationRequestErrorMessage,
  normalizeEmailVerificationCode,
  verificationDestination,
  verifyEmailAndRefresh,
} from './author-email-verification';

type VerifyEmailFormProps = { redirectTo: SafeRedirect; autoRequest: boolean };

export function VerifyEmailForm({ redirectTo, autoRequest }: VerifyEmailFormProps) {
  const api = useApiClient();
  const auth = useAuth();
  const router = useRouter();
  const accountLogout = useAccountLogout();
  const autoRequested = useRef(false);
  const verificationLock = useRef(false);
  const logoutStarted = useRef(false);
  const [code, setCode] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const logoutBusy = logoutStarted.current || accountLogout.busy;

  const requestCode = async () => {
    if (logoutStarted.current || accountLogout.busy || verificationLock.current) return;
    verificationLock.current = true;
    setRequesting(true);
    setError(null);
    try {
      await api.auth.requestEmailVerification();
      setNotice('Код отправлен на вашу почту.');
    } catch (requestError) {
      setError(
        emailVerificationRequestErrorMessage(
          getErrorStatus(requestError),
          getUserFacingErrorMessage(requestError, 'Не удалось отправить код.'),
        ),
      );
    } finally {
      verificationLock.current = false;
      setRequesting(false);
    }
  };

  useEffect(() => {
    if (!autoRequest || autoRequested.current || auth.user?.emailVerifiedAt) return;
    autoRequested.current = true;
    void requestCode();
  }, [auth.user?.emailVerifiedAt, autoRequest]);

  const verify = async () => {
    if (logoutStarted.current || accountLogout.busy || verificationLock.current) return;
    if (!/^\d{6}$/.test(code)) {
      setError('Введите шестизначный код.');
      return;
    }
    verificationLock.current = true;
    setVerifying(true);
    setError(null);
    try {
      const result = await verifyEmailAndRefresh({
        code,
        verify: async (value) => {
          await api.auth.verifyEmailVerification({ code: value });
        },
        refreshSession: auth.refreshSession,
      });
      const destination = verificationDestination(result === 'verified', redirectTo);
      if (!destination) {
        setError('Не удалось обновить статус подтверждения. Попробуйте ещё раз.');
        return;
      }
      router.replace(destination as Href);
    } catch (verifyError) {
      setError(getUserFacingErrorMessage(verifyError, 'Не удалось подтвердить email.'));
    } finally {
      verificationLock.current = false;
      setVerifying(false);
    }
  };

  const beginLogout = () => {
    if (logoutStarted.current || accountLogout.busy || verificationLock.current || requesting || verifying) return;
    logoutStarted.current = true;
    void accountLogout.logout();
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
          onChangeText={(value) => setCode(normalizeEmailVerificationCode(value))}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          error={error ?? undefined}
        />
        {notice ? <AppText role="bodySmall" tone="secondary">{notice}</AppText> : null}
        <PrimaryButton label="Подтвердить" width="full" loading={verifying} disabled={requesting || verifying || logoutBusy} onPress={() => void verify()} />
        <SecondaryButton label={requesting ? 'Отправляем код…' : 'Отправить код'} width="full" disabled={verifying || requesting || logoutBusy} onPress={() => void requestCode()} />
        <AccountLogoutButton pending={requesting || verifying || logoutBusy} onPress={beginLogout} />
      </View>
    </AuthCard>
  );
}
