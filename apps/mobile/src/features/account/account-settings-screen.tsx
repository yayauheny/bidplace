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
import { AppText } from '../../components/ui';
import { useAccountLogout } from '../auth/account-logout';

/**
 * /account/settings — только реальные строки согласованного среза:
 * «Публичный профиль» → существующий /profile (verified guard и intro
 * решают существующие владельцы) и logout с очисткой drafts/cache.
 * Email/password/language/currency/support не включены (intake).
 */
export function AccountSettingsScreen() {
  const router = useRouter();
  const { logout, busy } = useAccountLogout();

  return (
    <FormPageShell hideDock>
      <View style={{ gap: designTokens.space.x5 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <BackButton variant="settings" onPress={() => router.back()} />
          <AppText role="settingsTitle" tone="strong">
            Настройки
          </AppText>
          <FigmaIconButton
            icon="x"
            iconSize={designTokens.size.settingsHeaderGlyph}
            label="Закрыть настройки"
            onPress={() => router.back()}
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
