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
import { emailAddressSchema } from '@bidplace/contracts';

import { getUserFacingErrorMessage, readFormFailure } from '../../errors';
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
  const [emailError, setEmailError] = useState<string | null>(null);
  const [reasonError, setReasonError] = useState<string | null>(null);
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
      const failure = readFormFailure(error, ['email']);
      if (failure.fields.email) {
        setEmailError(failure.fields.email);
        setLookupError(failure.formMessage);
        return;
      }
      if (failure.disposition === 'form') {
        setLookupError(failure.formMessage);
        return;
      }
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
      const failure = readFormFailure(error, ['reason']);
      if (failure.fields.reason) setReasonError(failure.fields.reason);
      setActionError(
        failure.disposition === 'passthrough'
          ? getUserFacingErrorMessage(error, 'Не удалось обновить статус')
          : failure.formMessage,
      );
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
      const failure = readFormFailure(error, ['reason']);
      if (failure.fields.reason) setReasonError(failure.fields.reason);
      setActionError(
        failure.disposition === 'passthrough'
          ? getUserFacingErrorMessage(error, 'Не удалось сбросить сессии')
          : failure.formMessage,
      );
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
          onChangeText={(value) => {
            setEmailError(null);
            setEmail(value);
          }}
          placeholder="name@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          error={emailError ?? undefined}
        />
        <PrimaryButton
          label="Найти"
          loading={lookup.isPending}
          onPress={() => {
            const parsed = emailAddressSchema.safeParse(email);
            if (!parsed.success) {
              setEmailError(parsed.error.issues[0]?.message ?? 'Введите корректный email');
              setLookupError(null);
              return;
            }
            setEmailError(null);
            lookup.mutate();
          }}
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
              onChangeText={(value) => {
                setReasonError(null);
                setReason(value);
              }}
              onBlur={() => {
                if (!reason.trim()) setReasonError('Укажите причину');
              }}
              placeholder="Кратко опишите инцидент"
              error={reasonError ?? undefined}
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
