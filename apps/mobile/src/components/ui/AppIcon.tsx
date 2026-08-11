import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  ImageOff,
  LayoutGrid,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  Trash2,
  User,
  X,
} from 'lucide-react-native';

import { designTokens } from '@bidplace/design-tokens';

const icons = {
  chevronLeft: ChevronLeft,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  catalog: LayoutGrid,
  moderation: ShieldCheck,
  purchases: ShoppingBag,
  seller: Store,
  account: CircleUserRound,
  imageOff: ImageOff,
  logOut: LogOut,
  plus: Plus,
  search: Search,
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
