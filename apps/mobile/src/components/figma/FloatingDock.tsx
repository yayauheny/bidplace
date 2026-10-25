import type { RefObject } from 'react';
import { Link, type Href } from 'expo-router';
import { Platform, type View, type ViewStyle } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { useAppTheme } from '../../providers/theme-provider';
import { useAppNavigation } from '../layout/use-app-navigation';
import { useDockInset } from '../layout/use-dock-inset';
import { MotionPressable } from '../ui/MotionPressable';
import { FigmaIcon } from './FigmaIcon';
import { FloatingDockFrame } from './FloatingDockFrame';
import {
  SEARCH_DOCK_BUTTON_ID,
  dockItemAccessibility,
  getFigmaDockItems,
  isFigmaDockItemSelected,
  type FigmaDockItem,
} from './floating-dock';

const dockItemHitSlop =
  (designTokens.size.dockIconHit - designTokens.size.control) / 2;

export function FloatingDock({
  blurTarget,
}: {
  blurTarget: RefObject<View | null>;
}) {
  const navigation = useAppNavigation('figma-floating-dock');
  const { pathname, search } = navigation;
  const { bottom } = useDockInset();
  const items = getFigmaDockItems(navigation);
  const buttons = items.map((item) => (
    <DockItem
      key={item.id}
      item={item}
      selected={
        item.id === 'search'
          ? search.isOpen || isFigmaDockItemSelected(item.id, pathname)
          : !search.isOpen && isFigmaDockItemSelected(item.id, pathname)
      }
      href={
        item.href ??
        (item.id === 'home'
          ? '/'
          : item.id === 'profile'
            ? navigation.profileHref
            : undefined)
      }
      onPress={
        item.id === 'search'
          ? () => search.open()
          : item.id === 'plus'
            ? () => navigation.create(item.label)
            : item.id === 'profile'
              ? () => navigation.rememberAuthOpener(item.label)
              : undefined
      }
    />
  ));

  return (
    <FloatingDockFrame bottom={bottom} blurTarget={blurTarget}>
      {buttons}
    </FloatingDockFrame>
  );
}

function DockItem({
  item,
  selected,
  href,
  onPress,
}: {
  item: FigmaDockItem;
  selected: boolean;
  href?: Href;
  onPress?: () => void;
}) {
  const itemAccessibility = dockItemAccessibility(item.id, selected);
  const palette = useAppTheme();
  const content = (
    <MotionPressable
      {...(item.id === 'search'
        ? ({
            nativeID: SEARCH_DOCK_BUTTON_ID,
            ...(Platform.OS === 'web' ? { id: SEARCH_DOCK_BUTTON_ID } : {}),
          } as object)
        : {})}
      accessibilityRole={itemAccessibility.role}
      accessibilityLabel={item.label}
      accessibilityState={itemAccessibility.accessibilityState}
      {...(Platform.OS === 'web'
        ? {
            'aria-current': itemAccessibility.ariaCurrent,
          }
        : {})}
      onPress={onPress}
      preset="dock"
      hitSlop={dockItemHitSlop}
      style={{
        width: designTokens.size.control,
        height: designTokens.size.control,
        padding: designTokens.space.dockIconPad,
        borderRadius: designTokens.radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        ...(Platform.OS === 'web'
          ? ({ boxShadow: 'none', filter: 'none' } as ViewStyle)
          : null),
      }}
    >
      <FigmaIcon
        name={item.icon}
        variant={
          selected &&
          (item.id === 'home' || item.id === 'profile')
            ? 'filled'
            : 'outline'
        }
        strokeWidthPx={
          item.id === 'search'
            ? selected
              ? designTokens.stroke.iconActive
              : designTokens.stroke.icon
            : designTokens.stroke.iconHeavy
        }
        size={designTokens.size.dockIcon}
        color={palette.ink}
      />
    </MotionPressable>
  );

  return href ? (
    <Link href={href} asChild>
      {content}
    </Link>
  ) : (
    content
  );
}
