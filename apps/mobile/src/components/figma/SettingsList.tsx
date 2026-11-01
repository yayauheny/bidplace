import { Platform, View } from 'react-native';

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

type SettingsToggle = {
  value: boolean;
  onChange(value: boolean): void;
  disabled?: boolean;
};

type SettingsRowShared = {
  icon: FigmaIconName;
  label: string;
  /** Render the hairline divider above this row (all rows but the first). */
  divided?: boolean;
  /** Navigational rows show the chevron (Figma settings rows). */
  trailingArrow?: boolean;
  busy?: boolean;
};

type SettingsRowProps = SettingsRowShared &
  (
    | { onPress: () => void; toggle?: undefined }
    | { toggle: SettingsToggle; onPress?: never }
  );

/** Figma 7008:15192. That node is the on state only. */
const settingsSwitchTrack = { width: 36, height: 20 } as const;
const settingsSwitchThumb = 16;
const settingsSwitchInset = 2;

export function SettingsRow(props: SettingsRowProps) {
  const {
    icon,
    label,
    divided = false,
    trailingArrow = false,
    busy = false,
  } = props;
  const toggle = props.toggle;
  const disabled = busy || Boolean(toggle?.disabled);
  const palette = useAppTheme();
  const handleWebKeyDown = (event: {
    key: string;
    preventDefault: () => void;
    repeat: boolean;
  }) => {
    // Pressable activates Enter for role=switch and Space only for button.
    if (!toggle) return;
    if (event.key !== ' ' && event.key !== 'Spacebar') return;
    event.preventDefault();
    if (disabled || event.repeat) return;
    toggle.onChange(!toggle.value);
  };
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
        accessibilityRole={toggle ? 'switch' : 'button'}
        accessibilityLabel={label}
        accessibilityState={
          toggle ? { checked: toggle.value, disabled, busy } : { busy }
        }
        disabled={disabled}
        {...(Platform.OS === 'web' && toggle
          ? ({
              'aria-checked': toggle.value,
              onKeyDown: handleWebKeyDown,
            } as object)
          : {})}
        onPress={() => {
          if (toggle) {
            toggle.onChange(!toggle.value);
            return;
          }
          props.onPress();
        }}
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
        {toggle ? (
          <View
            testID="settings-switch-track"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              width: settingsSwitchTrack.width,
              height: settingsSwitchTrack.height,
              borderRadius: designTokens.radius.pill,
              padding: settingsSwitchInset,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: toggle.value ? 'flex-end' : 'flex-start',
              backgroundColor: toggle.value
                ? palette.inkStrong
                : palette.surfaceStrong,
              boxShadow: `inset 0px 2px 3px ${palette.overlayOnLight}`,
            }}
          >
            <View
              testID="settings-switch-thumb"
              style={{
                width: settingsSwitchThumb,
                height: settingsSwitchThumb,
                borderRadius: designTokens.radius.pill,
                backgroundColor: palette.canvas,
              }}
            />
          </View>
        ) : null}
        {trailingArrow && !toggle ? (
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
