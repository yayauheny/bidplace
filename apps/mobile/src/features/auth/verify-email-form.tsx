import { useEffect, useRef, useState } from 'react';
import { useRouter, type Href } from 'expo-router';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

import { AppText, PrimaryButton, SecondaryButton } from '../../components/ui';
import { ApiClientError } from '@bidplace/api-client';

import { getErrorStatus, getUserFacingErrorMessage, readFormFailure } from '../../errors';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';
import { type SafeRedirect } from './auth-redirect';
import { useAccountLogout } from './account-logout';
import { AccountLogoutButton } from './AccountLogoutButton';
import { AuthCodeField } from './auth-code-field';
import { useAuthSheetComplete, useAuthSheetGuard } from './auth-sheet-context';
import { verificationStatusCopy } from './verify-email-copy';
import { confirmedResendDeadline, resendRemainingSeconds } from './resend-deadline';
import {
  emailVerificationRequestErrorMessage,
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
  const [codeError, setCodeError] = useState<string | null>(null);
  const [resendDeadline, setResendDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const complete = useAuthSheetComplete();
  const logoutBusy = logoutStarted.current || accountLogout.busy;
  const remaining = resendRemainingSeconds(resendDeadline, now);
  useAuthSheetGuard({
    dirty: true,
    busy: requesting || verifying || logoutBusy,
  });

  const requestCode = async () => {
    if (logoutStarted.current || accountLogout.busy || verificationLock.current) return;
    verificationLock.current = true;
    setRequesting(true);
    setError(null);
    try {
      await api.auth.requestEmailVerification();
      setNotice('Код отправлен на вашу почту.');
      setResendDeadline(confirmedResendDeadline(Date.now()));
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
    if (resendDeadline === null) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    const onVisible = () => setNow(Date.now());
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisible);
    }
    return () => {
      clearInterval(timer);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisible);
      }
    };
  }, [resendDeadline]);

  useEffect(() => {
    if (!autoRequest || autoRequested.current || auth.user?.emailVerifiedAt) return;
    autoRequested.current = true;
    void requestCode();
  }, [auth.user?.emailVerifiedAt, autoRequest]);

  const verify = async () => {
    if (logoutStarted.current || accountLogout.busy || verificationLock.current) return;
    if (!/^\d{6}$/.test(code)) {
      setCodeError('Введите шестизначный код.');
      setError(null);
      return;
    }
    verificationLock.current = true;
    setVerifying(true);
    setError(null);
    setCodeError(null);
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
      if (complete) complete(destination);
      else router.replace(destination as Href);
    } catch (verifyError) {
      const failure = readFormFailure(verifyError, ['code']);
      if (failure.fields.code) {
        setCodeError(failure.fields.code);
        setError(failure.formMessage);
      } else if (failure.disposition === 'form') {
        setError(failure.formMessage);
      } else if (
        verifyError instanceof ApiClientError &&
        (verifyError.kind === 'forbidden' ||
          verifyError.kind === 'bad_request' ||
          verifyError.kind === 'unauthorized')
      ) {
        setError('Не удалось подтвердить код. Запросите новый и попробуйте ещё раз.');
      } else {
        setError(getUserFacingErrorMessage(verifyError, 'Не удалось подтвердить email.'));
      }
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

  const resendLabel = requesting
    ? 'Отправляем код…'
    : remaining > 0
      ? `Отправить повторно через ${remaining} сек`
      : notice
        ? 'Отправить повторно'
        : 'Отправить код';

  return (
      <View style={{ gap: designTokens.auth.screenGap }}>
        <AppText role="sectionTitle" style={{ textAlign: 'center', color: designTokens.color.fieldValue, fontSize: 20, lineHeight: 22, fontWeight: '600' }}>
          Проверьте код на почте
        </AppText>
        <AppText role="bodySmall" style={{ textAlign: 'center', color: designTokens.color.textSubdued }}>
          {verificationStatusCopy({
            email: auth.user?.email,
            sendAccepted: notice !== null,
          })}
        </AppText>
        <AuthCodeField
          value={code}
          onChangeText={(value) => {
            setCodeError(null);
            setCode(value);
          }}
          error={codeError ?? undefined}
        />
        {error ? (
          <AppText role="bodySmall" tone="danger" accessibilityLiveRegion="polite">
            {error}
          </AppText>
        ) : null}
        {notice ? <AppText role="bodySmall" tone="secondary">{notice}</AppText> : null}
        <PrimaryButton label="Завершить" size="auth" width="full" loading={verifying} disabled={requesting || verifying || logoutBusy} onPress={() => void verify()} />
        <SecondaryButton label={resendLabel} size="authResend" width="full" disabled={verifying || requesting || logoutBusy || remaining > 0} onPress={() => void requestCode()} />
        <AccountLogoutButton pending={requesting || verifying || logoutBusy} onPress={beginLogout} />
      </View>
  );
}
