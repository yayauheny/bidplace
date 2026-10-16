import type { RefObject } from 'react';
import {
  Link,
  type Href,
  useGlobalSearchParams,
  usePathname,
  useRouter,
  useSegments,
} from 'expo-router';
import { Platform, type View, type ViewStyle } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import {
  authorProfileDestination,
  useSellerCapability,
} from '../../hooks/use-seller-capability';
import { useAuth } from '../../providers/auth-provider';
import { useAppTheme } from '../../providers/theme-provider';
import { getRouteSearchRedirect } from '../../features/auth/auth-redirect';
import { useSearchOverlay } from '../../features/search/search-overlay-provider';
import { BidplaceMark } from '../branding/BidplaceBrand';
import { getMobileCreateHref } from '../layout/header-chrome';
import { useDockInset } from '../layout/use-dock-inset';
import { MotionPressable } from '../ui/MotionPressable';
import { FigmaIcon } from './FigmaIcon';
import { FloatingDockFrame } from './FloatingDockFrame';
import {
  SEARCH_DOCK_BUTTON_ID,
  dockItemAccessibility,
  figmaDockItems,
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
  const pathname = usePathname();
  const router = useRouter();
  const params = useGlobalSearchParams();
  const segments = useSegments();
  const auth = useAuth();
  const search = useSearchOverlay();
  const capability = useSellerCapability();
  const { bottom } = useDockInset();
  const returnPath = getRouteSearchRedirect(pathname, segments, params);
  const items = auth.isAdmin
    ? figmaDockItems.filter((item) => item.id !== 'plus')
    : figmaDockItems;
  const buttons = items.map((item) => (
    <DockItem
      key={item.id}
      item={item}
      selected={
        item.id === 'search'
          ? search.isOpen || isFigmaDockItemSelected(item.id, pathname)
          : !search.isOpen && isFigmaDockItemSelected(item.id, pathname)
      }
      href={dockHref(item, {
        pathname,
        isAuthenticated: auth.isAuthenticated,
        isAdmin: auth.isAdmin,
        sellerStatus: capability.status,
      })}
      onPress={
        item.id === 'search'
          ? () => search.open()
          : item.id === 'plus'
            ? () =>
                router.push(
                  getMobileCreateHref({
                    isAuthenticated: auth.isAuthenticated,
                    sellerStatus: capability.status,
                    returnPath,
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
      return undefined;
    case 'profile':
      if (context.isAdmin) return '/admin';
      if (context.isAuthenticated) {
        return authorProfileDestination(context.sellerStatus) as Href;
      }
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
      {item.icon === 'logo' ? (
        <BidplaceMark size={18} />
      ) : (
        <FigmaIcon
          name={item.icon}
          size={designTokens.size.dockIcon}
          color={palette.ink}
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
