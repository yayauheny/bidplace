import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { View } from 'react-native';

import {
  AppText,
  AppDialog,
  PrimaryButton,
  SecondaryButton,
  TextField,
} from '../../components/ui';
import { designTokens } from '@bidplace/design-tokens';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';
import {
  resolveEmailRulesEligibility,
  type EmailRulesEligibility,
} from './email-rules-eligibility';

type EmailRulesGateProps = {
  children: ReactNode;
  redirectTo: string;
};

type EmailRulesDialogProps = {
  open: boolean;
  redirectTo: string;
  onClose: () => void;
  onReady: () => void;
};

export function useEmailRulesEligibility(): {
  eligibility: EmailRulesEligibility;
  rules:
    | Awaited<
        ReturnType<ReturnType<typeof useApiClient>['auth']['getRules']>
      >['rules']
    | null;
  rulesError: boolean;
  refetchRules: () => Promise<unknown>;
} {
  const api = useApiClient();
  const auth = useAuth();
  const rulesQuery = useQuery({
    queryKey: ['auth', 'rules'],
    queryFn: () => api.auth.getRules(),
    enabled: auth.isAuthenticated && auth.user !== null && !auth.isAdmin,
  });

  const eligibility = resolveEmailRulesEligibility({
    ready: auth.ready,
    authenticated: auth.isAuthenticated,
    admin: auth.isAdmin,
    user: auth.user
      ? {
          emailVerifiedAt: auth.user.emailVerifiedAt,
          acceptedRulesVersion: auth.user.acceptedRulesVersion,
        }
      : null,
    rulesVersion: rulesQuery.data?.rules.version ?? null,
    rulesLoading: rulesQuery.isLoading,
    rulesError: Boolean(rulesQuery.error),
  });

  if (eligibility === 'loading' && !auth.ready) {
    return {
      eligibility: 'loading',
      rules: null,
      rulesError: false,
      refetchRules: rulesQuery.refetch,
    };
  }
  if (!auth.isAuthenticated) {
    return {
      eligibility: 'guest',
      rules: null,
      rulesError: false,
      refetchRules: rulesQuery.refetch,
    };
  }
  if (auth.isAdmin) {
    return {
      eligibility: 'admin',
      rules: null,
      rulesError: false,
      refetchRules: rulesQuery.refetch,
    };
  }
  if (!auth.user) {
    return {
      eligibility: 'error',
      rules: null,
      rulesError: true,
      refetchRules: rulesQuery.refetch,
    };
  }
  if (!auth.user.emailVerifiedAt) {
    return {
      eligibility: 'email',
      rules: rulesQuery.data?.rules ?? null,
      rulesError: Boolean(rulesQuery.error),
      refetchRules: rulesQuery.refetch,
    };
  }
  if (rulesQuery.isError) {
    return {
      eligibility: 'error',
      rules: null,
      rulesError: true,
      refetchRules: rulesQuery.refetch,
    };
  }
  if (rulesQuery.isLoading || !rulesQuery.data) {
    return {
      eligibility: 'loading',
      rules: null,
      rulesError: false,
      refetchRules: rulesQuery.refetch,
    };
  }
  return {
    eligibility:
      auth.user.acceptedRulesVersion === rulesQuery.data.rules.version
        ? 'ready'
        : 'rules',
    rules: rulesQuery.data.rules,
    rulesError: false,
    refetchRules: rulesQuery.refetch,
  };
}

export function EmailRulesGate({ children, redirectTo }: EmailRulesGateProps) {
  const api = useApiClient();
  const auth = useAuth();
  const [code, setCode] = useState('');
  const { eligibility, rules, rulesError, refetchRules } =
    useEmailRulesEligibility();

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
      if (!rules) {
        throw new Error('Rules are not available');
      }

      return api.auth.acceptRules({
        rulesVersion: rules.version,
      });
    },
    onSuccess: () => {
      void auth.refreshSession();
    },
  });

  if (eligibility === 'loading' && !auth.ready) {
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

  if (eligibility === 'admin') {
    return (
      <AppText role="bodySmall" tone="secondary">
        Администратор не участвует в торгах.
      </AppText>
    );
  }

  if (rulesError) {
    return (
      <View style={{ gap: designTokens.space.x3 }}>
        <AppText role="bodySmall" tone="danger">
          Не удалось загрузить правила
        </AppText>
        <SecondaryButton
          label="Повторить"
          onPress={() => void refetchRules()}
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
        {requestEmailVerification.isSuccess ? (
          <>
            <TextField
              label="Код из письма"
              value={code}
              onChangeText={(value) =>
                setCode(value.replace(/\D/g, '').slice(0, 6))
              }
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
            />
            <PrimaryButton
              label="Подтвердить email"
              disabled={code.length !== 6}
              loading={verifyEmail.isPending}
              onPress={() => verifyEmail.mutate()}
            />
          </>
        ) : null}
        {requestEmailVerification.isError || verifyEmail.isError ? (
          <AppText role="bodySmall" tone="danger">
            Не удалось подтвердить email. Попробуйте ещё раз.
          </AppText>
        ) : null}
      </View>
    );
  }

  if (!rules) {
    return (
      <AppText role="bodySmall" tone="secondary">
        Загружаем правила…
      </AppText>
    );
  }

  if (eligibility === 'rules') {
    return (
      <View style={{ gap: designTokens.space.x3 }}>
        <AppText role="label">
          Перед первой ставкой нужно принять правила сервиса.
        </AppText>
        <AppText role="bodySmall" tone="secondary">
          {rules.text}
        </AppText>
        <AppText role="caption" tone="muted">
          Версия: {rules.version}
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

export function EmailRulesDialog({
  open,
  redirectTo,
  onClose,
  onReady,
}: EmailRulesDialogProps) {
  const { eligibility } = useEmailRulesEligibility();

  useEffect(() => {
    if (open && eligibility === 'ready') onReady();
  }, [eligibility, onReady, open]);

  const title =
    eligibility === 'rules'
      ? 'Правила участия'
      : eligibility === 'email'
        ? 'Подтвердите email'
        : 'Проверяем доступ';
  const description =
    eligibility === 'email'
      ? 'Подтверждение требуется один раз — перед первой ставкой.'
      : eligibility === 'rules'
        ? 'Примите актуальные правила, чтобы перейти к ставке.'
        : undefined;

  return (
    <AppDialog
      open={open}
      title={title}
      description={description}
      onClose={onClose}
    >
      <EmailRulesGate redirectTo={redirectTo}>
        <View />
      </EmailRulesGate>
    </AppDialog>
  );
}
