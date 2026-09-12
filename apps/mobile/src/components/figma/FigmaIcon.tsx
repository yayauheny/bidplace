import { HugeiconsIcon } from '@hugeicons/react-native';
import { Platform } from 'react-native';
import {
  AiMagicIcon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  AtSignIcon,
  Calendar01Icon,
  Cancel01Icon,
  Clock04Icon,
  Copy01Icon,
  Share04Icon,
  Delete02Icon,
  FilterHorizontalIcon,
  GoogleIcon,
  Image01Icon,
  InstagramIcon,
  LockKeyholeIcon,
  MinusSignIcon,
  PlusSignIcon,
  QrCode01Icon,
  Search01Icon,
  ShoppingBasket01Icon,
  TelegramIcon,
  UserIcon,
  ViewIcon,
  ViewOffIcon,
} from '@hugeicons/core-free-icons';

import { figmaTokens } from '@bidplace/design-tokens';

import {
  type FigmaIconName,
  figmaIconNames,
} from './figma-icon-names';
import { figmaIconStrokeWidth } from './figma-icon-style';

const icons = {
  'filter-horizontal': FilterHorizontalIcon,
  'arrow-up-down': ArrowUpDownIcon,
  'search-01': Search01Icon,
  'delete-02': Delete02Icon,
  x: Cancel01Icon,
  'arrow-left-01': ArrowLeft01Icon,
  'arrow-right-01': ArrowRight01Icon,
  'arrow-up-01': ArrowUp01Icon,
  'arrow-down-01': ArrowDown01Icon,
  plus: PlusSignIcon,
  minus: MinusSignIcon,
  copy: Copy01Icon,
  'share-04': Share04Icon,
  'qr-code-01': QrCode01Icon,
  'lock-keyhole': LockKeyholeIcon,
  'clock-04': Clock04Icon,
  telegram: TelegramIcon,
  instagram: InstagramIcon,
  google: GoogleIcon,
  'eye-off': ViewOffIcon,
  view: ViewIcon,
  'at-sign': AtSignIcon,
  'image-01': Image01Icon,
  'calendar-01': Calendar01Icon,
  'ai-magic': AiMagicIcon,
  user: UserIcon,
  'shopping-basket-01': ShoppingBasket01Icon,
} as const satisfies Record<FigmaIconName, typeof Search01Icon>;

export function FigmaIcon({
  name,
  size = figmaTokens.size.icon,
  color = figmaTokens.color.ink,
  label,
}: {
  name: FigmaIconName;
  size?: number;
  color?: string;
  label?: string;
}) {
  return (
    <HugeiconsIcon
      icon={icons[name]}
      size={size}
      color={color}
      strokeWidth={figmaIconStrokeWidth(name, size)}
      {...(label
        ? { accessibilityLabel: label }
        : Platform.OS === 'web'
          ? { 'aria-hidden': true }
          : { accessible: false })}
    />
  );
}

export { figmaIconNames };
