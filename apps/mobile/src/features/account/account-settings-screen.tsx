import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../providers/auth-provider';
import { useApiClient } from '../../providers/api-provider';
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
 * /account/settings — только реальные строки согласованного среза:
 * «Публичный профиль» → существующий /profile (verified guard и intro
 * решают существующие владельцы) и logout с очисткой drafts/cache.
 * Явное подключение Google/Telegram использует общий серверный auth flow.
 */
export function AccountSettingsScreen() {
  const router = useRouter();
  const api = useApiClient();
  const auth = useAuth();
  const connections = useQuery({
    queryKey: ['user', auth.user?.id, 'auth', 'connections'],
    queryFn: ({ signal }) => api.auth.connections({ signal }),
    retry: false,
  });
  const { logout, busy } = useAccountLogout();

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
