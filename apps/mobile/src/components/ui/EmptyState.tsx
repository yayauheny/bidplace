import { Pressable } from 'react-native';
import { Text, YStack } from 'tamagui';

import { mobileSpacing } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';

type EmptyStateProps = {
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const palette = useAppThemePalette();

  return (
    <YStack
      flex={1}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: mobileSpacing[16],
        paddingHorizontal: mobileSpacing[6],
        gap: mobileSpacing[3],
      }}
      role="status"
    >
      {title ? (
        <Text
          style={{
            color: palette.color,
            fontSize: 17,
            lineHeight: 22,
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
      ) : null}
      <Text
        style={{
          color: palette.colorMuted,
          fontSize: 14,
          lineHeight: 21,
          textAlign: 'center',
          maxWidth: 320,
        }}
      >
        {description}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => ({
            marginTop: mobileSpacing[2],
            paddingHorizontal: mobileSpacing[4],
            paddingVertical: mobileSpacing[2],
            borderRadius: 8,
            borderWidth: 1,
            borderColor: palette.borderColor,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text
            style={{
              color: palette.color,
              fontSize: 14,
              lineHeight: 20,
              fontWeight: '500',
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </YStack>
  );
}
