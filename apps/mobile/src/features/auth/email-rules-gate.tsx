import { useState, type ReactNode } from 'react';
import { Link } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { View } from 'react-native';

import {
  AppText,
  PrimaryButton,
  SecondaryButton,
  TextField,
} from '../../components/ui';
import { designTokens } from '@bidplace/design-tokens';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';

type EmailRulesGateProps = {
  children: ReactNode;
  redirectTo: string;
};

export function EmailRulesGate({ children, redirectTo }: EmailRulesGateProps) {
  const api = useApiClient();
  const auth = useAuth();
  const [code, setCode] = useState('');

  const rulesQuery = useQuery({
    queryKey: ['auth', 'rules'],
    queryFn: () => api.auth.getRules(),
    enabled: auth.isAuthenticated && auth.user !== null,
  });

  const requestEmailVerification = useMutation({
    mutationFn: () => api.auth.requestEmailVerification(),
  });

  const verifyEmail = useMutation({
    mutationFn: () => api.auth.verifyEmailVerification({ code }),
    onSuccess: () => {
      void auth.refreshSession();
    },
  });

  const acceptRules = useMutation({
    mutationFn: () => {
      if (!rulesQuery.data) {
        throw new Error('Rules are not available');
      }

      return api.auth.acceptRules({
        rulesVersion: rulesQuery.data.rules.version,
      });
    },
    onSuccess: () => {
      void auth.refreshSession();
    },
  });

  if (!auth.ready) {
    return (
      <AppText role="bodySmall" tone="secondary">
        Проверяем доступ…
      </AppText>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <View style={{ gap: designTokens.space.x3 }}>
        <AppText role="bodySmall" tone="secondary">
          Войдите, чтобы продолжить.
        </AppText>
        <Link href={{ pathname: '/login', params: { redirectTo } }} asChild>
          <PrimaryButton label="Войти" onPress={() => undefined} />
        </Link>
      </View>
    );
  }

  if (!auth.user) {
    return (
      <View style={{ gap: designTokens.space.x3 }}>
        <AppText role="bodySmall" tone="danger">
          Не удалось восстановить сессию
        </AppText>
        <SecondaryButton
          label="Повторить"
          onPress={() => void auth.refreshSession()}
        />
      </View>
    );
  }

  if (rulesQuery.isError) {
    return (
      <View style={{ gap: designTokens.space.x3 }}>
        <AppText role="bodySmall" tone="danger">
          Не удалось загрузить правила
        </AppText>
        <SecondaryButton
          label="Повторить"
          onPress={() => void rulesQuery.refetch()}
        />
      </View>
    );
  }

  if (!auth.user.emailVerifiedAt) {
    return (
      <View style={{ gap: designTokens.space.x3 }}>
        <AppText role="bodySmall" tone="secondary">
          Чтобы сделать первую ставку, подтвердите email. Мы отправим код на
          этот адрес. После подтверждения можно будет сделать ставку.
        </AppText>
        <SecondaryButton
          label="Отправить код"
          loading={requestEmailVerification.isPending}
          onPress={() => requestEmailVerification.mutate()}
        />
        <TextField
          label="Код из письма"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          placeholder="000000"
        />
        <PrimaryButton
          label="Подтвердить email"
          loading={verifyEmail.isPending}
          onPress={() => verifyEmail.mutate()}
        />
        {requestEmailVerification.isError || verifyEmail.isError ? (
          <AppText role="bodySmall" tone="danger">
            Не удалось подтвердить email. Попробуйте ещё раз.
          </AppText>
        ) : null}
      </View>
    );
  }

  if (!rulesQuery.data) {
    return (
      <AppText role="bodySmall" tone="secondary">
        Загружаем правила…
      </AppText>
    );
  }

  if (auth.user.acceptedRulesVersion !== rulesQuery.data.rules.version) {
    return (
      <View style={{ gap: designTokens.space.x3 }}>
        <AppText role="label">Перед первой ставкой нужно принять правила сервиса.</AppText>
        <AppText role="bodySmall" tone="secondary">
          {rulesQuery.data.rules.text}
        </AppText>
        <AppText role="caption" tone="muted">
          Версия: {rulesQuery.data.rules.version}
        </AppText>
        <PrimaryButton
          label="Принять правила"
          loading={acceptRules.isPending}
          onPress={() => acceptRules.mutate()}
        />
        {acceptRules.isError ? (
          <AppText role="bodySmall" tone="danger">
            Не удалось принять правила. Попробуйте ещё раз.
          </AppText>
        ) : null}
      </View>
    );
  }

  return <>{children}</>;
}
