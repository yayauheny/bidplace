import {
  ChevronLeft,
  ImageOff,
  LogOut,
  Menu,
  Plus,
  Trash2,
  User,
  X,
} from 'lucide-react-native';

import { modernTokens } from '@bidplace/design-tokens';

const icons = {
  chevronLeft: ChevronLeft,
  imageOff: ImageOff,
  logOut: LogOut,
  menu: Menu,
  plus: Plus,
  trash: Trash2,
  user: User,
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
  size = modernTokens.size.icon,
  color = modernTokens.color.ink,
  label,
}: AppIconProps) {
  const Icon = icons[name];
  return (
    <Icon
      size={size}
      color={color}
      accessibilityLabel={label}
      accessible={label ? true : undefined}
    />
  );
}
