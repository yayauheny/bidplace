import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { ApiClient } from '@bidplace/api-client';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

import {
  AppText,
  DestructiveButton,
  FormSection,
  PrimaryButton,
  SecondaryButton,
  TextField,
} from '../../components/ui';
import { getUserFacingErrorMessage } from '../../lib/errors';
import { useApiClient } from '../../providers/api-provider';

type AdminUser = Awaited<
  ReturnType<ApiClient['admin']['lookupUsers']>
>['users'][number];

export function AdminUsersPanel() {
  const api = useApiClient();
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [user, setUser] = useState<AdminUser | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const lookup = useMutation({
    mutationFn: () => api.admin.lookupUsers({ email }),
    onSuccess: (response) => {
      setLookupError(null);
      setActionError(null);
      setActionMessage(null);
      setUser(response.users[0] ?? null);
      if (response.users.length === 0) {
        setLookupError('Пользователь с таким email не найден.');
      }
    },
    onError: (error) => {
      setUser(null);
      setLookupError(getUserFacingErrorMessage(error, 'Не удалось найти пользователя'));
    },
  });

  const updateStatus = useMutation({
    mutationFn: (status: 'active' | 'banned') =>
      api.admin.updateUserStatus(user!.id, { status, reason: reason.trim() }),
    onSuccess: (response) => {
      setUser(response);
      setActionError(null);
      setActionMessage(
        response.status === 'banned'
          ? 'Пользователь заблокирован, активные сессии сброшены.'
          : 'Пользователь разблокирован.',
      );
    },
    onError: (error) => {
      setActionMessage(null);
      setActionError(getUserFacingErrorMessage(error, 'Не удалось обновить статус'));
    },
  });

  const revokeSessions = useMutation({
    mutationFn: () =>
      api.admin.revokeUserSessions(user!.id, { reason: reason.trim() }),
    onSuccess: () => {
      setActionError(null);
      setActionMessage('Все активные сессии пользователя сброшены.');
    },
    onError: (error) => {
      setActionMessage(null);
      setActionError(getUserFacingErrorMessage(error, 'Не удалось сбросить сессии'));
    },
  });

  const reasonMissing = reason.trim().length === 0;
  const pending =
    lookup.isPending || updateStatus.isPending || revokeSessions.isPending;

  return (
    <FormSection
      title="Пользователи"
      description="Точный поиск по email, блокировка и сброс сессий с обязательной причиной."
    >
      <View style={{ gap: designTokens.space.x3 }}>
        <TextField
          label="Email пользователя"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <PrimaryButton
          label="Найти"
          loading={lookup.isPending}
          onPress={() => lookup.mutate()}
        />
        {lookupError ? (
          <AppText role="bodySmall" tone="danger">
            {lookupError}
          </AppText>
        ) : null}
        {user ? (
          <>
            <AppText role="bodySmall" tone="secondary">
              {user.displayName} · {user.email} · {user.status}
            </AppText>
            <TextField
              label="Причина действия"
              value={reason}
              onChangeText={setReason}
              placeholder="Кратко опишите инцидент"
            />
            {user.status === 'active' ? (
              <DestructiveButton
                label="Заблокировать"
                loading={updateStatus.isPending}
                disabled={reasonMissing || pending}
                onPress={() => updateStatus.mutate('banned')}
              />
            ) : (
              <SecondaryButton
                label="Разблокировать"
                loading={updateStatus.isPending}
                disabled={reasonMissing || pending}
                onPress={() => updateStatus.mutate('active')}
              />
            )}
            <SecondaryButton
              label="Сбросить сессии"
              loading={revokeSessions.isPending}
              disabled={reasonMissing || pending}
              onPress={() => revokeSessions.mutate()}
            />
          </>
        ) : null}
        {actionMessage ? (
          <AppText role="bodySmall" tone="secondary">
            {actionMessage}
          </AppText>
        ) : null}
        {actionError ? (
          <AppText role="bodySmall" tone="danger">
            {actionError}
          </AppText>
        ) : null}
      </View>
    </FormSection>
  );
}
