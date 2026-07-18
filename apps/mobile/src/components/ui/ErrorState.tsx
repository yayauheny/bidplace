import { mobileSpacing } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';
import { AppButton } from './AppButton';
import { AppCard } from './AppCard';
import { Text, YStack } from 'tamagui';

type ErrorStateProps = {
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ErrorState({
  title = 'Что-то пошло не так',
  description,
  actionLabel = 'Повторить',
  onAction,
}: ErrorStateProps) {
  const palette = useAppThemePalette();

  return (
    <AppCard style={{ borderColor: palette.danger, paddingVertical: mobileSpacing[8] }}>
      <YStack style={{ alignItems: 'center', gap: mobileSpacing[3], maxWidth: 420 }}>
        <Text
          style={{
            color: palette.text,
            fontSize: 24,
            lineHeight: 30,
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            color: palette.danger,
            fontSize: 14,
            lineHeight: 20,
            textAlign: 'center',
          }}
        >
          {description}
        </Text>
        {onAction ? <AppButton onPress={onAction}>{actionLabel}</AppButton> : null}
      </YStack>
    </AppCard>
  );
}
