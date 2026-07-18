import { Pressable } from 'react-native';
import { Text, YStack } from 'tamagui';

import { mobileSpacing } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';

type ErrorKind = 'generic' | 'network' | 'notFound' | 'forbidden';

type ErrorStateProps = {
  description: string;
  kind?: ErrorKind;
  actionLabel?: string;
  onAction?: () => void;
};

const kindLabels: Record<ErrorKind, string> = {
  generic: 'Что-то пошло не так',
  network: 'Нет подключения',
  notFound: 'Страница не найдена',
  forbidden: 'Нет доступа',
};

export function ErrorState({
  description,
  kind = 'generic',
  actionLabel,
  onAction,
}: ErrorStateProps) {
  const palette = useAppThemePalette();
  const title = kindLabels[kind];
  const defaultActionLabel = kind === 'network' ? 'Повторить' : 'Попробовать снова';

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
      role="alert"
    >
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
      {onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel ?? defaultActionLabel}
          style={({ pressed }) => ({
            marginTop: mobileSpacing[2],
            paddingHorizontal: mobileSpacing[4],
            paddingVertical: mobileSpacing[2],
            borderRadius: 8,
            borderWidth: 1,
            borderColor: palette.primary,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text
            style={{
              color: palette.primary,
              fontSize: 14,
              lineHeight: 20,
              fontWeight: '600',
            }}
          >
            {actionLabel ?? defaultActionLabel}
          </Text>
        </Pressable>
      ) : null}
    </YStack>
  );
}
