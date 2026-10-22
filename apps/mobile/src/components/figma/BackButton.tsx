import { FigmaIconButton } from './FigmaIconButton';

export function BackButton({
  onPress,
  label = 'Назад',
  disabled = false,
}: {
  onPress: () => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <FigmaIconButton
      icon="arrow-left-01"
      iconSize={20}
      strokeWidthPx={1.5}
      surface="muted"
      label={label}
      disabled={disabled}
      onPress={onPress}
    />
  );
}
