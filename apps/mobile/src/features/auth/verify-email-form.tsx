import { useCallback, useRef, useState } from 'react';
import { useIsFocused, usePathname, useRouter, type Href } from 'expo-router';
import { Platform, View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

import { AppText, PrimaryButton, SecondaryButton, TextButton, TextField } from '../../components/ui';
import { AUTH_TURNSTILE_UNAVAILABLE_COPY } from '../../errors';
import { getTurnstileSiteKey } from '../../lib/environment';
import { useAuth } from '../../providers/auth-provider';
import { AuthCodeField } from './auth-code-field';
import { type SafeRedirect } from './auth-redirect';
import { useAuthSheetComplete, useAuthSheetGuard } from './auth-sheet-context';
import { verificationDestination } from './author-email-verification';
import { TurnstileWidget, type TurnstileAvailability } from './turnstile-widget';
import { useEmailVerification } from './use-email-verification';
import {
  verificationReasonCopy,
  verificationSendLabel,
  verificationStatusCopy,
} from './verify-email-copy';

type VerifyEmailFormProps = { redirectTo: SafeRedirect };

const VERIFY_EMAIL_ROUTE = '/verify-email';

function canChallenge(): boolean {
  return Platform.OS === 'web' && Boolean(getTurnstileSiteKey());
}

export function VerifyEmailForm({ redirectTo }: VerifyEmailFormProps) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const focused = useIsFocused();
  const complete = useAuthSheetComplete();
  const pathnameRef = useRef(pathname);
  const focusedRef = useRef(focused);
  pathnameRef.current = pathname;
  focusedRef.current = focused;
  const [proof, setProof] = useState<string | null>(null);
  const [availability, setAvailability] = useState<TurnstileAvailability>('ready');
  const [widgetGeneration, setWidgetGeneration] = useState(0);
  const onProof = useCallback((token: string | null) => setProof(token), []);
  const onAvailability = useCallback((next: TurnstileAvailability) => setAvailability(next), []);
  const onVerified = useCallback(() => {
    if (!focusedRef.current || !pathnameRef.current.startsWith(VERIFY_EMAIL_ROUTE)) return;
    const destination = verificationDestination(true, redirectTo);
    if (!destination) return;
    if (complete) complete(destination);
    else router.replace(destination as Href);
  }, [complete, redirectTo, router]);
  const verification = useEmailVerification({ focused, onVerified });
  const email = auth.user?.email ?? verification.serverState?.email ?? null;
  const clientUnavailable = !canChallenge() || availability === 'unavailable';
  const ready = verification.readStatus === 'ready';
  const busy = verification.reading || verification.sending || verification.verifying || verification.correcting;
  const waitSeconds = Math.max(verification.remaining.resend, verification.remaining.quota);
  const codeExpired = verification.deadlines.codeExpiresAt !== null && verification.remaining.code === 0;
  const paused = verification.remaining.pause > 0;
  const fieldReason = verification.reason?.kind === 'otp-invalid'
    || verification.reason?.kind === 'otp-expired'
    || (verification.reason?.kind === 'validation' && verification.editingEmail === null);
  const emailReason = verification.editingEmail !== null
    && (verification.reason?.kind === 'taken'
      || verification.reason?.kind === 'disposable'
      || verification.reason?.kind === 'validation');
  const reasonCopy = verificationReasonCopy(verification.reason, verification.remaining);
  const banner = fieldReason || emailReason ? null : reasonCopy;
  useAuthSheetGuard({
    dirty: verification.code.length > 0 || verification.editingEmail !== null,
    busy,
  });

  const send = (freshIntent: boolean) => {
    if (!ready || busy) return;
    if (freshIntent && waitSeconds > 0) return;
    if (clientUnavailable) return;
    if (!proof) {
      void verification.send('', false);
      return;
    }
    const token = proof;
    setProof(null);
    setWidgetGeneration((generation) => generation + 1);
    void verification.send(token, freshIntent);
  };

  const sendLabel = verificationSendLabel({
    sending: verification.sending,
    sendStatus: verification.serverState?.sendStatus ?? null,
    resendSeconds: verification.remaining.resend,
    quotaSeconds: verification.remaining.quota,
    retrySendPending: verification.retrySendPending,
  });

  return (
    <View style={{ gap: designTokens.auth.screenGap, width: '100%' }}>
      <View style={{ gap: designTokens.auth.titleGap }}>
        <AppText role="sectionTitle" style={{ textAlign: 'center', color: designTokens.color.fieldValue, ...designTokens.typography.authScreenTitle }}>
          Проверьте код на почте
        </AppText>
        <AppText role="bodySmall" style={{ textAlign: 'center', color: designTokens.color.textSubdued, ...designTokens.typography.authCaption, letterSpacing: 0 }}>
          {verification.readStatus === 'loading'
            ? 'Проверяем статус подтверждения…'
            : verification.readStatus === 'error'
              ? 'Не удалось прочитать статус подтверждения.'
              : verificationStatusCopy({
                email,
                sendStatus: verification.serverState?.sendStatus ?? null,
                verified: verification.serverState?.verified === true,
                retrySendPending: verification.retrySendPending,
              })}
        </AppText>
      </View>
      {verification.readStatus === 'error' ? (
        <SecondaryButton
          label="Повторить чтение"
          width="full"
          disabled={verification.reading}
          onPress={verification.retry}
        />
      ) : null}
      {ready && verification.editingEmail === null ? (
        <TextButton label="Изменить адрес" onPress={() => verification.setEditingEmail(email ?? '')} />
      ) : null}
      {ready && verification.editingEmail !== null ? (
        <View style={{ gap: designTokens.auth.formGap, width: '100%' }}>
          <TextField
            label="Электронная почта"
            value={verification.editingEmail}
            onChangeText={verification.setEditingEmail}
            autoComplete="email"
            keyboardType="email-address"
            error={emailReason ? reasonCopy ?? undefined : undefined}
          />
          <SecondaryButton
            label="Сохранить адрес"
            width="full"
            loading={verification.correcting}
            disabled={busy}
            onPress={() => void verification.correct()}
          />
          <TextButton label="Отмена" onPress={() => verification.setEditingEmail(null)} />
        </View>
      ) : null}
      {ready ? (
        <AuthCodeField
          value={verification.code}
          onChangeText={verification.setCode}
          error={fieldReason ? reasonCopy ?? undefined : undefined}
        />
      ) : null}
      {banner ? (
        <AppText role="bodySmall" tone="danger" accessibilityLiveRegion="polite">
          {banner}
        </AppText>
      ) : null}
      {clientUnavailable && ready ? (
        <AppText role="bodySmall" tone="danger" accessibilityLiveRegion="polite">
          {AUTH_TURNSTILE_UNAVAILABLE_COPY}
        </AppText>
      ) : null}
      {canChallenge() && ready ? (
        <TurnstileWidget
          key={widgetGeneration}
          action="email_verification"
          onToken={onProof}
          onAvailability={onAvailability}
        />
      ) : null}
      {ready ? (
        <PrimaryButton
          label="Завершить"
          width="full"
          loading={verification.verifying}
          disabled={busy || verification.code.length !== 6 || verification.verifyLocked || paused || codeExpired}
          onPress={() => void verification.verify()}
        />
      ) : null}
      {ready && verification.retrySendPending ? (
        <SecondaryButton
          label="Повторить тот же запрос"
          width="full"
          disabled={busy || clientUnavailable}
          onPress={() => send(false)}
        />
      ) : null}
      {ready ? (
        <SecondaryButton
          label={sendLabel}
          width="full"
          disabled={busy || waitSeconds > 0 || clientUnavailable}
          onPress={() => send(true)}
        />
      ) : null}
    </View>
  );
}
