import type { RefObject } from 'react';
import { Image } from 'expo-image';
import { Link, type Href, usePathname, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { figmaTokens } from '@bidplace/design-tokens';

import { useSellerCapability } from '../../hooks/use-seller-capability';
import { useAuth } from '../../providers/auth-provider';
import { getMobileCreateHref } from '../layout/header-chrome';
import { MotionPressable } from '../ui/MotionPressable';
import { FigmaIcon } from './FigmaIcon';
import { FloatingDockFrame } from './FloatingDockFrame';
import {
  figmaDockItems,
  isFigmaDockItemSelected,
  type FigmaDockItem,
} from './floating-dock';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const brandMark = require('../../../assets/branding/bidplace-logo.png');
const dockItemHitSlop =
  (figmaTokens.size.dockIconHit - figmaTokens.size.control) / 2;

export function FloatingDock({
  blurTarget,
}: {
  blurTarget: RefObject<View | null>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const capability = useSellerCapability();
  const insets = useSafeAreaInsets();
  const items = auth.isAdmin
    ? figmaDockItems.filter((item) => item.id !== 'plus')
    : figmaDockItems;
  const bottom = Math.max(insets.bottom, 12);
  const buttons = items.map((item) => (
    <DockItem
      key={item.id}
      item={item}
      selected={isFigmaDockItemSelected(item.id, pathname)}
      href={dockHref(item, {
        pathname,
        isAuthenticated: auth.isAuthenticated,
        isAdmin: auth.isAdmin,
        sellerStatus: capability.status,
      })}
      onPress={
        item.id === 'plus'
          ? () =>
              router.push(
                getMobileCreateHref({
                  isAuthenticated: auth.isAuthenticated,
                  sellerStatus: capability.status,
                  returnPath: pathname || '/',
                }),
              )
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

function dockHref(
  item: FigmaDockItem,
  context: {
    pathname: string;
    isAuthenticated: boolean;
    isAdmin: boolean;
    sellerStatus: ReturnType<typeof useSellerCapability>['status'];
  },
): Href | undefined {
  switch (item.id) {
    case 'home':
      return '/';
    case 'search':
      return '/search';
    case 'profile':
      if (context.isAdmin) return '/admin';
      if (context.isAuthenticated) return '/profile';
      return '/login';
    case 'plus':
      return undefined;
  }
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
  const content = (
    <MotionPressable
      accessibilityRole={href ? 'link' : 'button'}
      accessibilityLabel={item.label}
      accessibilityState={{ selected }}
      onPress={onPress}
      preset="icon"
      hitSlop={dockItemHitSlop}
      style={{
        width: figmaTokens.size.control,
        height: figmaTokens.size.control,
        padding: figmaTokens.space.dockIconPad,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {item.icon === 'logo' ? (
        <Image
          source={brandMark}
          contentFit="contain"
          style={{
            width: figmaTokens.size.dockIcon,
            height: 18,
          }}
        />
      ) : (
        <FigmaIcon
          name={item.icon}
          size={figmaTokens.size.dockIcon}
          color={figmaTokens.color.ink}
        />
      )}
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
