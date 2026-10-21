import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { useAppTheme } from '../../providers/theme-provider';
import { AppText } from '../ui/AppText';
import { MotionPressable } from '../ui/MotionPressable';
import { FigmaIcon } from './FigmaIcon';
import type { FigmaIconName } from './figma-icon-names';

/**
 * Settings list (account/settings Figma): section label above a rounded
 * surface of icon+label rows separated by hairline dividers.
 * Single-purpose composition for the settings screen, not a generic renderer.
 */
export function SettingsGroup({
  label,
  children,
}: {
  /** Group caption above the surface; omit for a bare surface (logout). */
  label?: string;
  children: React.ReactNode;
}) {
  const palette = useAppTheme();
  return (
    <View style={{ gap: designTokens.space.quietButtonGap }}>
      {label ? (
        <AppText role="settingsSection" style={{ color: palette.accountMeta }}>
          {label}
        </AppText>
      ) : null}
      <View
        style={{
          backgroundColor: palette.settingsSurface,
          borderRadius: designTokens.radius.settingsSurface,
          paddingHorizontal: designTokens.space.settingsSurfacePadX,
          paddingVertical: designTokens.space.x2,
        }}
      >
        {children}
      </View>
    </View>
  );
}

export function SettingsRow({
  icon,
  label,
  onPress,
  divided = false,
  trailingArrow = false,
  busy = false,
}: {
  icon: FigmaIconName;
  label: string;
  onPress: () => void;
  /** Render the hairline divider above this row (all rows but the first). */
  divided?: boolean;
  /** Navigational rows show the chevron (Figma settings rows). */
  trailingArrow?: boolean;
  busy?: boolean;
}) {
  const palette = useAppTheme();
  return (
    <View>
      {divided ? (
        <View
          style={{
            height: 1,
            backgroundColor: palette.settingsDivider,
          }}
        />
      ) : null}
      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ busy }}
        disabled={busy}
        onPress={onPress}
        preset="icon"
        style={{
          minHeight: designTokens.size.touch,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: designTokens.space.x2,
          paddingVertical: designTokens.space.x3,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: designTokens.space.x2,
            flex: 1,
            minWidth: 0,
          }}
        >
          <FigmaIcon
            name={icon}
            size={designTokens.size.settingsRowIcon}
            color={palette.inkStrong}
          />
          <AppText role="settingsRow" style={{ flexShrink: 1 }}>
            {label}
          </AppText>
        </View>
        {trailingArrow ? (
          <FigmaIcon
            name="arrow-right-01"
            size={designTokens.size.settingsRowIcon}
            color={palette.fieldIcon}
          />
        ) : null}
      </MotionPressable>
    </View>
  );
}
