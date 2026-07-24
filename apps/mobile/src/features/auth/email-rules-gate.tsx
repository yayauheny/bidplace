import { useState, type ReactNode } from 'react';
import { Link } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Text, YStack } from 'tamagui';

import {
  AppButton,
  AppInput,
  ErrorState,
  LoadingState,
} from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';
import { useAppThemePalette } from '../../theme/palette';
import { mobileSpacing } from '../../theme/tokens';

type EmailRulesGateProps = {
  children: ReactNode;
  redirectTo: string;
};

export function EmailRulesGate({ children, redirectTo }: EmailRulesGateProps) {
  const api = useApiClient();
  const auth = useAuth();
  const palette = useAppThemePalette();
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
    return <LoadingState label="Проверяем доступ" />;
  }

  if (!auth.isAuthenticated) {
    return (
      <YStack style={{ gap: mobileSpacing[3] }}>
        <Text
          style={{
            color: palette.colorSecondary,
            fontSize: 14,
            lineHeight: 20,
          }}
        >
          Войдите, чтобы продолжить.
        </Text>
        <Link href={{ pathname: '/login', params: { redirectTo } }} asChild>
          <AppButton tone="primary">Войти</AppButton>
        </Link>
      </YStack>
    );
  }

  if (!auth.user) {
    return (
      <ErrorState
        description="Не удалось восстановить сессию"
        onAction={() => {
          void auth.refreshSession();
        }}
      />
    );
  }

  if (rulesQuery.isError) {
    return (
      <ErrorState
        description="Не удалось загрузить правила"
        onAction={() => {
          void rulesQuery.refetch();
        }}
      />
    );
  }

  if (!auth.user.emailVerifiedAt) {
    return (
      <YStack style={{ gap: mobileSpacing[3] }}>
        <Text
          style={{
            color: palette.colorSecondary,
            fontSize: 14,
            lineHeight: 20,
          }}
        >
          Мы отправим код на ваш email. После подтверждения откроем ставку и
          проверим правила сервиса.
        </Text>
        <AppButton
          tone="secondary"
          isLoading={requestEmailVerification.isPending}
          onPress={() => requestEmailVerification.mutate()}
        >
          Отправить код
        </AppButton>
        <AppInput
          label="Код из письма"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          placeholder="000000"
        />
        <AppButton
          tone="primary"
          isLoading={verifyEmail.isPending}
          onPress={() => verifyEmail.mutate()}
        >
          Подтвердить email
        </AppButton>
        {requestEmailVerification.isError || verifyEmail.isError ? (
          <Text
            style={{
              color: palette.negative,
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            Не удалось подтвердить email. Попробуйте ещё раз.
          </Text>
        ) : null}
      </YStack>
    );
  }

  if (!rulesQuery.data) {
    return <LoadingState label="Загружаем правила" />;
  }

  if (auth.user.acceptedRulesVersion !== rulesQuery.data.rules.version) {
    return (
      <YStack style={{ gap: mobileSpacing[3] }}>
        <Text
          style={{
            color: palette.colorSecondary,
            fontSize: 14,
            lineHeight: 20,
          }}
        >
          {rulesQuery.data.rules.text}
        </Text>
        <Text
          style={{
            color: palette.colorMuted,
            fontSize: 12,
            lineHeight: 16,
          }}
        >
          Версия: {rulesQuery.data.rules.version}
        </Text>
        <AppButton
          tone="primary"
          isLoading={acceptRules.isPending}
          onPress={() => acceptRules.mutate()}
        >
          Принять правила
        </AppButton>
        {acceptRules.isError ? (
          <Text
            style={{
              color: palette.negative,
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            Не удалось принять правила. Попробуйте ещё раз.
          </Text>
        ) : null}
      </YStack>
    );
  }

  return <>{children}</>;
}
