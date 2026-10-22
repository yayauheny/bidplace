import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ApiClientError } from '@bidplace/api-client';
import { designTokens } from '@bidplace/design-tokens';
import {
  onboardingRequestSchema,
  type LegalDocumentId,
  type LegalDocumentsResponse,
} from '@bidplace/contracts';
import {
  AppText,
  PrimaryButton,
  TextButton,
  TextField,
} from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';
import { AuthCodeField } from './auth-code-field';
import { AuthConsentCheckbox } from './auth-consent-checkbox';
import {
  RegistrationLegalText,
  registrationConsentLabel,
} from './auth-legal-text';
import { LegalDocumentViewer } from './legal-document-viewer';
import { createOperationKey } from './recovery-operation';
import { useAuthFlowAction } from './use-auth-flow-action';
import { useAuthSheetComplete, useAuthSheetGuard } from './auth-sheet-context';
import {
  TurnstileWidget,
  type TurnstileAvailability,
} from './turnstile-widget';
import { useAuthFlowCompletion } from './use-auth-flow-completion';
import { getSafeRedirect } from './auth-redirect';

export function OnboardingForm() {
  const api = useApiClient();
  const auth = useAuth();
  const router = useRouter();
  const complete = useAuthSheetComplete();
  const action = useAuthFlowAction();
  const queueCompletion = useAuthFlowCompletion(action.busy);
  const [email, setEmail] = useState('');
  const [slug, setSlug] = useState('');
  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState('');
  const [proof, setProof] = useState<string | null>(null);
  const [availability, setAvailability] =
    useState<TurnstileAvailability>('ready');
  const [generation, setGeneration] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [legalOpen, setLegalOpen] = useState<LegalDocumentId | null>(null);
  const [documents, setDocuments] = useState<LegalDocumentsResponse | null>(
    null,
  );
  const emailEdited = useRef(false);
  const sendKey = useRef<string | null>(null);
  const verifyKey = useRef<string | null>(null);
  const state = useQuery({
    queryKey: ['user', 'auth', 'onboarding'],
    queryFn: async ({ signal }) => {
      try {
        return await api.auth.onboarding({ signal });
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 401)
          return null;
        throw error;
      }
    },
    enabled: auth.ready,
    retry: false,
    gcTime: 0,
  });
  const verification = useQuery({
    queryKey: ['user', 'auth', 'onboarding', 'email'],
    queryFn: ({ signal }) => api.auth.onboardingEmailState({ signal }),
    enabled: state.data?.stage === 'email',
    retry: false,
    gcTime: 0,
  });
  useEffect(() => {
    if (state.data?.email && !emailEdited.current) setEmail(state.data.email);
  }, [state.data?.email]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const onProof = useCallback((token: string | null) => setProof(token), []);
  const onAvailability = useCallback(
    (value: TurnstileAvailability) => setAvailability(value),
    [],
  );
  useAuthSheetGuard({
    busy: action.busy,
    dirty: Boolean(email || slug || consent || code),
  });
  const finish = async (
    result: Awaited<ReturnType<typeof api.auth.completeOnboarding>>,
    isCurrent: () => boolean,
  ) => {
    if (result.next === 'email') {
      await state.refetch();
      return;
    }
    const installed = await auth.refreshSession();
    if (!isCurrent() || installed?.id !== result.user.id) return;
    const destination = getSafeRedirect(result.returnPath);
    queueCompletion(result.user.id, destination);
  };
  const submit = () => {
    if (!consent) {
      action.setError('Подтвердите документы и возраст 18+.');
      return;
    }
    if (!proof) {
      action.setError('Пройдите проверку безопасности.');
      return;
    }
    const parsed = onboardingRequestSchema.safeParse({
      email,
      slug,
      legal: {
        agreement: { confirmed: true },
        privacy: { confirmed: true },
        dataConsent: { confirmed: true },
        age18Confirmed: true,
      },
      turnstileToken: proof,
    });
    if (!parsed.success) {
      action.setError(
        parsed.error.issues[0]?.message ?? 'Проверьте поля формы.',
      );
      return;
    }
    setProof(null);
    setGeneration((value) => value + 1);
    void action.run(
      (signal) => api.auth.completeOnboarding(parsed.data, { signal }),
      finish,
    );
  };
  const send = () => {
    if (!proof) {
      action.setError('Пройдите проверку безопасности.');
      return;
    }
    const token = proof;
    setProof(null);
    setGeneration((value) => value + 1);
    sendKey.current ??= createOperationKey();
    void action.run(
      async (signal) => {
        try {
          return await api.auth.requestOnboardingEmail(
            { turnstileToken: token, idempotencyKey: sendKey.current! },
            { signal },
          );
        } catch (failure) {
          if (
            failure instanceof ApiClientError &&
            failure.kind !== 'network' &&
            failure.kind !== 'server'
          )
            sendKey.current = null;
          throw failure;
        }
      },
      async () => {
        sendKey.current = null;
        await verification.refetch();
      },
    );
  };
  const verify = () => {
    verifyKey.current ??= createOperationKey();
    void action.run(async (signal) => {
      try {
        return await api.auth.verifyOnboardingEmail(
          { code, idempotencyKey: verifyKey.current! },
          { signal },
        );
      } catch (failure) {
        if (
          failure instanceof ApiClientError &&
          failure.kind !== 'network' &&
          failure.kind !== 'server'
        ) {
          verifyKey.current = null;
          void verification.refetch();
        }
        throw failure;
      }
    }, finish);
  };
  const openLegal = (id: LegalDocumentId) => {
    setLegalOpen(id);
    if (!documents)
      void action.run(
        (signal) => api.auth.getLegalDocuments({ signal }),
        (result) => setDocuments(result),
      );
  };
  const server = verification.data;
  const offset = useMemo(
    () => (server ? Date.now() - Date.parse(server.serverNow) : 0),
    [server],
  );
  const resendAt = Math.max(
    Date.parse(server?.resendAvailableAt ?? '') || 0,
    Date.parse(server?.quotaResetsAt ?? '') || 0,
  );
  const resendSeconds = Math.max(
    0,
    Math.ceil((resendAt + offset - now) / 1000),
  );
  const paused = Boolean(
    server?.pausedUntil && Date.parse(server.pausedUntil) + offset > now,
  );
  if (state.isPending)
    return <AppText role="bodySmall">Загружаем регистрацию…</AppText>;
  if (state.isError || state.data === null)
    return (
      <View style={{ gap: designTokens.auth.formGap }}>
        <AppText role="bodySmall" tone="danger">
          Не удалось открыть попытку входа. Она могла завершиться или истечь.
        </AppText>
        <TextButton label="Повторить" onPress={() => void state.refetch()} />
        <TextButton label="Начать вход заново" href="/login" />
      </View>
    );
  const stage = state.data?.stage;
  return (
    <View style={{ gap: designTokens.auth.formGap }}>
      {stage === 'profile' ? (
        <>
          <TextField
            label="Электронная почта"
            value={email}
            autoComplete="email"
            keyboardType="email-address"
            editable={!action.busy}
            onChangeText={(value) => {
              action.cancel();
              emailEdited.current = true;
              setEmail(value);
            }}
          />
          <TextField
            label="Никнейм"
            value={slug}
            autoComplete="username"
            autoCapitalize="none"
            editable={!action.busy}
            onChangeText={(value) => {
              action.cancel();
              setSlug(value.replace(/^@+/, ''));
            }}
          />
          <AuthConsentCheckbox
            checked={consent}
            label={registrationConsentLabel}
            onChange={setConsent}
          >
            <RegistrationLegalText onOpenDocument={openLegal} />
          </AuthConsentCheckbox>
          <TurnstileWidget
            key={generation}
            action="register"
            onToken={onProof}
            onAvailability={onAvailability}
          />
          <PrimaryButton
            label="Завершить регистрацию"
            size="auth"
            width="full"
            loading={action.busy}
            disabled={!consent || availability === 'unavailable'}
            onPress={submit}
          />
        </>
      ) : stage === 'ready' ? (
        <PrimaryButton
          label="Завершить вход"
          onPress={() =>
            void action.run(
              (signal) => api.auth.resumeOnboarding({ signal }),
              finish,
            )
          }
          loading={action.busy}
        />
      ) : (
        <>
          <AppText role="bodySmall">
            Подтвердите почту {email}, чтобы завершить вход.
          </AppText>
          {verification.isPending ? (
            <AppText role="bodySmall">Проверяем состояние кода…</AppText>
          ) : null}
          {verification.isError ? (
            <TextButton
              label="Повторить загрузку состояния кода"
              onPress={() => void verification.refetch()}
            />
          ) : null}
          <AuthCodeField
            value={code}
            onChangeText={(value) => {
              action.cancel();
              setCode(value);
              verifyKey.current = null;
            }}
          />
          <PrimaryButton
            label="Подтвердить и войти"
            size="auth"
            width="full"
            loading={action.busy}
            disabled={code.length !== 6 || paused || action.busy}
            onPress={verify}
          />
          <TurnstileWidget
            key={generation}
            action="email_verification"
            onToken={onProof}
            onAvailability={onAvailability}
          />
          <TextButton
            label={
              resendSeconds > 0
                ? `Запросить код через ${resendSeconds} с`
                : 'Запросить код'
            }
            disabled={
              action.busy ||
              resendSeconds > 0 ||
              !server ||
              availability === 'unavailable'
            }
            onPress={send}
          />
          <AppText role="bodySmall" tone="secondary">
            {server?.sendStatus === 'accepted'
              ? 'Почтовый сервер принял письмо. Проверьте почту и «Спам».'
              : server?.sendStatus === 'unknown'
                ? 'Результат отправки неизвестен. Проверьте почту перед повтором.'
                : 'Нажмите «Запросить код», чтобы получить письмо.'}
          </AppText>
        </>
      )}
      {action.error ? (
        <AppText
          role="bodySmall"
          tone="danger"
          accessibilityLiveRegion="polite"
        >
          {action.error}
        </AppText>
      ) : null}
      <TextButton
        label="Отменить и вернуться ко входу"
        disabled={action.busy}
        onPress={() =>
          void action.run(
            (signal) => api.auth.cancelOnboarding({ signal }),
            () => {
              if (complete) complete('/login');
              else router.replace('/login');
            },
          )
        }
      />
      <LegalDocumentViewer
        selected={legalOpen}
        documents={documents}
        loading={action.busy && legalOpen !== null}
        onClose={() => setLegalOpen(null)}
      />
    </View>
  );
}
