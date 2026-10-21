import { createElement } from 'react';
import { Svg, Circle, Ellipse, Path } from 'react-native-svg';
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
  Home01Icon,
  HeadingIcon,
  TextIcon,
  Cancel01Icon,
  Clock04Icon,
  Copy01Icon,
  Share04Icon,
  Share03Icon,
  FavouriteIcon,
  MoreVerticalIcon,
  Flag01Icon,
  Link01Icon,
  PencilEdit01Icon,
  Delete02Icon,
  FilterHorizontalIcon,
  GoogleIcon,
  Image01Icon,
  InstagramIcon,
  InternetIcon,
  LockKeyholeIcon,
  LogOutIcon,
  MinusSignIcon,
  PlusSignIcon,
  QrCode01Icon,
  Search01Icon,
  Setting07Icon,
  ShoppingBasket01Icon,
  ImageAdd02Icon,
  TelegramIcon,
  UserIcon,
  ViewIcon,
  ViewOffIcon,
} from '@hugeicons/core-free-icons';

import { designTokens } from '@bidplace/design-tokens';

import { useAppTheme } from '../../providers/theme-provider';
import { type FigmaIconName, figmaIconNames } from './figma-icon-names';
import { figmaIconStrokeWidth } from './figma-icon-style';

// Source node: directions fallbacks `001-584_17554.svg` (16-frame check, 24-grid path).
const checkIcon = [
  [
    'path',
    {
      d: 'M5.00025 13.26L7.5861 15.957C8.2527 16.653 8.586 17.001 9.0003 17.001C9.41445 17.001 9.7479 16.653 10.4145 15.957L19.0002 7.0005',
      stroke: 'currentColor',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeWidth: '1.5',
      key: '0',
    },
  ],
] as const satisfies typeof Search01Icon;

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
  'share-03': Share03Icon,
  heart: FavouriteIcon,
  'more-vertical': MoreVerticalIcon,
  'flag-01': Flag01Icon,
  'link-01': Link01Icon,
  'pencil-edit-01': PencilEdit01Icon,
  'qr-code-01': QrCode01Icon,
  'lock-keyhole': LockKeyholeIcon,
  'clock-04': Clock04Icon,
  telegram: TelegramIcon,
  instagram: InstagramIcon,
  internet: InternetIcon,
  google: GoogleIcon,
  'eye-off': ViewOffIcon,
  view: ViewIcon,
  'at-sign': AtSignIcon,
  'image-01': Image01Icon,
  'calendar-01': Calendar01Icon,
  'home-01': Home01Icon,
  'ai-magic': AiMagicIcon,
  user: UserIcon,
  'shopping-basket-01': ShoppingBasket01Icon,
  'image-add-02': ImageAdd02Icon,
  heading: HeadingIcon,
  text: TextIcon,
  check: checkIcon,
  'setting-07': Setting07Icon,
  'log-out': LogOutIcon,
} as const satisfies Record<FigmaIconName, typeof Search01Icon>;

const iconGridSize = 24;

export function FigmaIcon({
  name,
  size = designTokens.size.icon,
  color,
  label,
  strokeWidthPx,
}: {
  name: FigmaIconName;
  size?: number;
  /** Explicit caller color wins; the default follows the active theme. */
  color?: string;
  label?: string;
  /** Final rendered stroke in px; replaces the per-icon grid stroke policy. */
  strokeWidthPx?: number;
}) {
  const themeColors = useAppTheme();
  const resolvedColor = color ?? themeColors.ink;
  // Hugeicons strokes live on the 24-unit grid, so a px value is scaled to it.
  const strokeWidth =
    strokeWidthPx === undefined
      ? figmaIconStrokeWidth(name, size)
      : (strokeWidthPx * iconGridSize) / size;
  if (name === 'internet') {
    // Hugeicons RN 1.0.16 drops ellipse nodes; preserve the source glyph.
    const elements = { circle: Circle, ellipse: Ellipse, path: Path };
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        color={resolvedColor}
        aria-hidden={label ? undefined : true}
        accessibilityLabel={label}
      >
        {InternetIcon.map(([tag, { key, ...attributes }]) =>
          createElement(elements[tag as keyof typeof elements], {
            ...attributes,
            key,
            strokeWidth,
          }),
        )}
      </Svg>
    );
  }
  return (
    <HugeiconsIcon
      icon={icons[name]}
      size={size}
      color={resolvedColor}
      strokeWidth={strokeWidth}
      {...(label
        ? { accessibilityLabel: label }
        : Platform.OS === 'web'
          ? { 'aria-hidden': true }
          : { accessible: false })}
    />
  );
}

export { figmaIconNames };
