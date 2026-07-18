import { ActivityIndicator } from 'react-native';

import { mobileSpacing } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';
import { Text, XStack, YStack } from 'tamagui';

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = 'Загрузка' }: LoadingStateProps) {
  const palette = useAppThemePalette();

  return (
    <YStack style={{ padding: mobileSpacing[8] }}>
      <XStack style={{ alignItems: 'center', justifyContent: 'center', gap: mobileSpacing[2] }}>
        <ActivityIndicator size="small" color={palette.primary} />
        <Text style={{ color: palette.textMuted, fontSize: 14, lineHeight: 20 }}>
          {label}
        </Text>
      </XStack>
    </YStack>
  );
}
