import { designTokens } from '@bidplace/design-tokens';
import { FigmaIconButton } from './FigmaIconButton';

export function BackButton({
  onPress,
  accessibilityHint,
  disabled = false,
  surface = 'muted',
}: {
  onPress: () => void;
  accessibilityHint?: string;
  disabled?: boolean;
  surface?: 'muted' | 'glass';
}) {
  return (
    <FigmaIconButton
      icon="arrow-left-02"
      size="navigation"
      iconSize={designTokens.size.navigationGlyph}
      strokeWidthPx={designTokens.stroke.iconHeavy}
      surface={surface}
      label="Назад"
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
    />
  );
}
