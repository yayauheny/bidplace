import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { designTokens } from '@bidplace/design-tokens';
import { emailAddressSchema } from '@bidplace/contracts';
import { ApiClientError } from '@bidplace/api-client';
import {
  AppText,
  PrimaryButton,
  TextButton,
  TextField,
} from '../../components/ui';
import { authKeys } from '../../lib/query-cache';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';
import { AuthCodeField } from './auth-code-field';
import { createOperationKey } from './recovery-operation';
import { useAuthFlowCompletion } from './use-auth-flow-completion';
import { useAuthFlowAction } from './use-auth-flow-action';
import { useAuthSheetGuard } from './auth-sheet-context';
import { useInvisibleTurnstile } from './turnstile-widget';
import type { SafeRedirect } from './auth-redirect';

export function EmailLoginForm({ redirectTo }: { redirectTo: SafeRedirect }) {
  const api = useApiClient();
  const { getToken } = useInvisibleTurnstile('email_login');
  const auth = useAuth();
  const action = useAuthFlowAction();
  const queueCompletion = useAuthFlowCompletion(action.busy);
  const [email, setEmail] = useState('');
  const [requested, setRequested] = useState(false);
  const [code, setCode] = useState('');

  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(Date.now());
  const emailEdited = useRef(false);
  const sendKey = useRef<string | null>(null);
  const verifyKey = useRef<string | null>(null);
  const state = useQuery({
    queryKey: authKeys.emailLoginState,
    queryFn: async ({ signal }) => {
      try {
        return await api.auth.loginCodeState({ signal });
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
  useEffect(() => {
    if (state.data && !emailEdited.current) {
      setEmail(state.data.email);
      setRequested(true);
      setDeadline(
        Date.now() +
          Math.max(
            0,
            Date.parse(state.data.resendAvailableAt ?? state.data.serverNow) -
              Date.parse(state.data.serverNow),
          ),
      );
    }
  }, [state.data]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useAuthSheetGuard({ busy: action.busy, dirty: Boolean(email || code) });
  const send = () => {
    const parsed = emailAddressSchema.safeParse(email);
    if (!parsed.success) {
      action.setError('Введите корректную электронную почту.');
      return;
    }
    sendKey.current ??= createOperationKey();
    void action.run(
      async (signal, isCurrent) => {
        const token = await getToken(signal);
        if (!isCurrent()) return null;
        if (!token) {
          action.setError('Попробуйте ещё раз');
          return null;
        }
        try {
          return await api.auth.requestLoginCode(
            {
              email: parsed.data,
              turnstileToken: token,
              idempotencyKey: sendKey.current!,
            },
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
      (result) => {
        if (!result) return;
        setRequested(true);
        setDeadline(
          Date.now() +
            Math.max(
              0,
              Date.parse(result.resendAvailableAt) -
                Date.parse(result.serverNow),
            ),
        );
        sendKey.current = null;
      },
    );
  };
  const verify = () => {
    verifyKey.current ??= createOperationKey();
    void action.run(
      async (signal) => {
        try {
          return await auth.verifyLoginCode(
            { code, idempotencyKey: verifyKey.current! },
            { signal },
          );
        } catch (failure) {
          if (
            failure instanceof ApiClientError &&
            failure.kind !== 'network' &&
            failure.kind !== 'server'
          )
            verifyKey.current = null;
          throw failure;
        }
      },
      (result) => queueCompletion(result.user.id, redirectTo),
    );
  };
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));
  const readFailed =
    state.isError &&
    (!(state.error instanceof ApiClientError) || state.error.status !== 401);
  if (!auth.ready)
    return <AppText role="bodySmall">Подготавливаем вход…</AppText>;
  return (
    <View style={{ gap: designTokens.auth.formGap }}>
      {state.isPending ? (
        <AppText role="bodySmall">Подготавливаем вход…</AppText>
      ) : null}
      {readFailed ? (
        <TextButton
          label="Повторить загрузку попытки входа"
          onPress={() => void state.refetch()}
        />
      ) : null}
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
          setRequested(false);
          setCode('');
          setDeadline(0);
          sendKey.current = null;
          verifyKey.current = null;
        }}
      />
      {requested ? (
        <>
          <AppText role="bodySmall">
            Если аккаунт с этой почтой готов к входу, мы отправили код. Новый
            аккаунт не создаётся. Проверьте также папку «Спам».
          </AppText>
          <AuthCodeField
            value={code}
            onChangeText={(value) => {
              action.cancel();
              setCode(value);
              verifyKey.current = null;
            }}
          />
          <PrimaryButton
            label="Войти"
            width="full"
            size="auth"
            loading={action.busy}
            disabled={code.length !== 6 || action.busy}
            onPress={verify}
          />
        </>
      ) : null}
      <TextButton
        label={
          remaining > 0
            ? `Повторить запрос через ${remaining} с`
            : requested
              ? 'Запросить код ещё раз'
              : 'Получить код'
        }
        disabled={
          action.busy || remaining > 0
        }
        onPress={send}
      />
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
        label="Войти с паролем"
        href={{ pathname: '/login', params: { redirectTo } }}
      />
      <TextButton
        label="Регистрация"
        href={{ pathname: '/register', params: { redirectTo } }}
      />
    </View>
  );
}
