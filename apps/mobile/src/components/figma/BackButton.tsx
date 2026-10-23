import { FigmaIconButton } from './FigmaIconButton';

export function BackButton({
  onPress,
  label = 'Назад',
  disabled = false,
  surface = 'muted',
}: {
  onPress: () => void;
  label?: string;
  disabled?: boolean;
  surface?: 'plain' | 'muted';
}) {
  return (
    <FigmaIconButton
      icon="arrow-left-01"
      iconSize={20}
      strokeWidthPx={1.5}
      surface={surface}
      label={label}
      disabled={disabled}
      onPress={onPress}
    />
  );
}
