import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Image } from 'expo-image';
import { Link, type Href, usePathname, useRouter } from 'expo-router';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { figmaTokens } from '@bidplace/design-tokens';

import { useSellerCapability } from '../../hooks/use-seller-capability';
import { useAuth } from '../../providers/auth-provider';
import { getMobileCreateHref } from '../layout/header-chrome';
import { MotionPressable } from '../ui/MotionPressable';
import { FigmaIcon } from './FigmaIcon';
import {
  figmaDockItems,
  isFigmaDockItemSelected,
  type FigmaDockItem,
} from './floating-dock';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const brandMark = require('../../../assets/branding/bidplace-logo.png');

export function FloatingDock() {
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
    <DockFrame bottom={bottom}>
      {buttons}
    </DockFrame>
  );
}

function DockFrame({
  bottom,
  children,
}: {
  bottom: number;
  children: ReactNode;
}) {
  const [webHost, setWebHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setWebHost(document.body);
    }
  }, []);

  if (Platform.OS === 'web') {
    if (!webHost) {
      return null;
    }

    return createPortal(
      <div className="figma-dock-layer" style={{ bottom }}>
        <div
          className="figma-dock-glass"
          role="tablist"
          aria-label="Основная навигация"
        >
          {children}
        </div>
      </div>,
      webHost,
    );
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom,
        alignItems: 'center',
        zIndex: 20,
      }}
    >
      <View
        accessibilityRole="tablist"
        accessibilityLabel="Основная навигация"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: figmaTokens.space.dockGap,
          padding: figmaTokens.space.dockPad,
          borderRadius: figmaTokens.radius.dock,
          borderWidth: 0.5,
          borderColor: figmaTokens.color.glassBorder,
          backgroundColor: figmaTokens.color.glass,
          ...figmaTokens.elevation.floating,
        }}
      >
        {children}
      </View>
    </View>
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
      style={{
        minWidth: figmaTokens.size.dockIconHit,
        minHeight: figmaTokens.size.dockIconHit,
        padding: figmaTokens.space.dockIconPad,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: selected ? 1 : 0.72,
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
