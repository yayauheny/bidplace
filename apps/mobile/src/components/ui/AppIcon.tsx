import { X } from 'lucide-react-native';

import { designTokens } from '@bidplace/design-tokens';

const icons = {
  x: X,
} as const;

export type AppIconName = keyof typeof icons;

type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
  label?: string;
};

export function AppIcon({
  name,
  size = designTokens.size.icon,
  color = designTokens.color.ink,
  label,
}: AppIconProps) {
  const Icon = icons[name];
  return (
    <Icon
      size={size}
      color={color}
      {...(label ? { accessibilityLabel: label } : {})}
    />
  );
}
