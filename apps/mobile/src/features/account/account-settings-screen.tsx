import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authKeys, commerceKeys } from '../../lib/query-cache';
import { useAuth } from '../../providers/auth-provider';
import { useApiClient } from '../../providers/api-provider';
import { commitOutbidToggle } from './use-outbid-email';
import { ProviderButtons } from '../auth/provider-buttons';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { BackButton } from '../../components/figma/BackButton';
import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import {
  SettingsGroup,
  SettingsRow,
} from '../../components/figma/SettingsList';
import { FormPageShell } from '../../components/layout';
import { AppText, TextButton } from '../../components/ui';
import { useAccountLogout } from '../auth/account-logout';

/**
 * /account/settings — публичный профиль, переход к контактам сделки,
 * показ почты, письмо «перебили», строка поддержки и logout.
 * Подключение Google/Telegram использует общий серверный auth flow.
 */
export function AccountSettingsScreen() {
  const router = useRouter();
  const api = useApiClient();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [outbidError, setOutbidError] = useState<string | null>(null);
  const [outbidPending, setOutbidPending] = useState(false);
  const connections = useQuery({
    queryKey: authKeys.connections(auth.user?.id),
    queryFn: ({ signal }) => api.auth.connections({ signal }),
    enabled: Boolean(auth.user?.id),
    retry: false,
  });
  const notifications = useQuery({
    queryKey: commerceKeys.notificationSettings(),
    queryFn: ({ signal }) => api.commerce.getNotificationSettings({ signal }),
    enabled: Boolean(auth.user?.id),
    retry: false,
  });
  const { logout, busy } = useAccountLogout();
  const changeOutbid = async (next: boolean) => {
    if (outbidPending) return;
    setOutbidPending(true);
    setOutbidError(null);
    const result = await commitOutbidToggle({
      queryClient,
      next,
      update: (value) =>
        api.commerce.updateNotificationSettings({ outbidEmail: value }),
    });
    setOutbidPending(false);
    if (result === 'rolled-back') {
      setOutbidError('Не удалось сохранить. Переключатель возвращён.');
    }
  };

  return (
    <FormPageShell hideDock variant="settings">
      <View style={{ gap: designTokens.space.x5 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <BackButton
            // dismissTo: в естественном стеке возвращает к существующему
            // /account, при direct/reload входе ведёт к /account без
            // собственных проверок history (web держит index под свежей
            // загрузкой, canGoBack там не различает сценарии).
            onPress={() => router.dismissTo('/account')}
          />
          <AppText role="settingsTitle" tone="strong">
            Настройки
          </AppText>
          <FigmaIconButton
            icon="x"
            size="settingsHeader"
            iconSize={designTokens.size.settingsHeaderGlyph}
            label="Закрыть настройки"
            onPress={() => router.dismissTo('/account')}
          />
        </View>
        <SettingsGroup label="Главное">
          <SettingsRow
            icon="user"
            label="Публичный профиль"
            trailingArrow
            onPress={() => router.push('/profile')}
          />
          <SettingsRow
            icon="at-sign"
            label="Контакты для сделок"
            divided
            trailingArrow
            onPress={() => router.push('/account/contacts')}
          />
        </SettingsGroup>
        <View style={{ gap: designTokens.space.x1 }}>
          <AppText role="settingsSection">Почта</AppText>
          <AppText role="body">{auth.user?.email ?? 'Почта не указана'}</AppText>
          <AppText role="bodySmall">
            {auth.user?.emailVerifiedAt
              ? 'Подтверждена. Изменить здесь нельзя.'
              : 'Почта не подтверждена.'}
          </AppText>
        </View>
        <SettingsGroup label="Уведомления">
          {notifications.data ? (
            <SettingsRow
              icon="bell"
              label="Письмо, когда ставку перебили"
              busy={outbidPending}
              toggle={{
                value: notifications.data.outbidEmail,
                disabled: outbidPending,
                onChange: (value) => void changeOutbid(value),
              }}
            />
          ) : null}
          {notifications.isPending ? (
            <AppText role="bodySmall">Загружаем уведомления…</AppText>
          ) : null}
          <AppText role="bodySmall">Письма о заказах приходят всегда.</AppText>
          {notifications.isError ? (
            <TextButton
              label="Повторить загрузку уведомлений"
              onPress={() => void notifications.refetch()}
            />
          ) : null}
          {outbidError ? (
            <AppText role="bodySmall" tone="danger">
              {outbidError}
            </AppText>
          ) : null}
        </SettingsGroup>
        <SettingsGroup label="Поддержка">
          <AppText role="bodySmall">
            Адрес поддержки ещё не опубликован.
          </AppText>
        </SettingsGroup>
        <SettingsGroup label="Способы входа">
          <View
            style={{
              gap: designTokens.space.x3,
              paddingVertical: designTokens.space.x3,
            }}
          >
            <AppText role="bodySmall">
              Подключайте провайдера только к своему аккаунту. Для подключения
              нужен вход за последние 5 минут; при запросе повторного входа
              выйдите и войдите заново.
            </AppText>
            {connections.isPending ? (
              <AppText role="bodySmall">Загружаем подключения…</AppText>
            ) : null}
            {connections.isError ? (
              <TextButton
                label="Повторить загрузку подключений"
                onPress={() => void connections.refetch()}
              />
            ) : null}
            {connections.data ? (
              <ProviderButtons
                intent="link"
                returnPath="/account/settings"
                connected={connections.data.connections.map(
                  (item) => item.provider,
                )}
              />
            ) : null}
          </View>
        </SettingsGroup>
        <SettingsGroup>
          <SettingsRow
            icon="log-out"
            label="Выйти"
            busy={busy}
            onPress={() => void logout()}
          />
        </SettingsGroup>
      </View>
    </FormPageShell>
  );
}
