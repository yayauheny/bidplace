import { ActivityIndicator, View } from 'react-native';
import { Text, YStack } from 'tamagui';

import { mobileSpacing } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';

type LoadingStateProps = {
  label?: string;
  /** compact = inline spinner without centering flex */
  compact?: boolean;
};

export function LoadingState({ label, compact = false }: LoadingStateProps) {
  const palette = useAppThemePalette();

  if (compact) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: mobileSpacing[2] }}>
        <ActivityIndicator size="small" color={palette.colorMuted} />
        {label ? (
          <Text style={{ color: palette.colorMuted, fontSize: 14, lineHeight: 20 }}>
            {label}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <YStack
      flex={1}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: mobileSpacing[16],
        gap: mobileSpacing[3],
      }}
      role="status"
      aria-label={label ? undefined : 'Загрузка'}
    >
      <ActivityIndicator size="large" color={palette.primary} />
      {label ? (
        <Text style={{ color: palette.colorMuted, fontSize: 14, lineHeight: 20 }}>
          {label}
        </Text>
      ) : null}
    </YStack>
  );
}
