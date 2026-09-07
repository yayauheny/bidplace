import { useEffect, useRef, useState } from 'react';
import { Link, usePathname, type Href } from 'expo-router';
import { Platform, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppIcon, AppText, MotionPressable } from '../ui';
import { OverlayPortal } from './OverlayHost';
import {
  assignFocusableAnchorRef,
  type FocusableAnchor,
} from './focusable-anchor';
import { overlayMenuItemStyle, overlayPanelStyle } from './overlay-layout';
import { useDismissibleOverlay } from './use-dismissible-overlay';
import { discoveryTriggerInteractionStyle, discoveryTriggerStyle } from './header-layout';

type DiscoveryDropdownProps = {
  desktop: boolean;
  onNavigate: () => void;
};

export function DiscoveryMenu({
  desktop,
  label,
}: {
  desktop: boolean;
  label: 'Работы' | 'Авторы';
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<FocusableAnchor | null>(null);

  const active =
    pathname === '/works' ||
    pathname === '/authors' ||
    pathname === '/search' ||
    pathname.startsWith('/product/') ||
    pathname.startsWith('/seller/');

  useEffect(() => setOpen(false), [pathname]);

  useDismissibleOverlay({
    open,
    onClose: () => setOpen(false),
    restoreFocus: () => triggerRef.current?.focus?.(),
    getSurfaces: () => [
      document.getElementById('discovery-menu-trigger'),
      document.getElementById('discovery-menu-dropdown'),
    ],
  });

  const dropdown = (
    <DiscoveryDropdown
      desktop={Platform.OS === 'web'}
      onNavigate={() => setOpen(false)}
    />
  );

  return (
    <View nativeID="discovery-menu-trigger" style={{ position: 'relative' }}>
      <MotionPressable
        ref={(node) => assignFocusableAnchorRef(triggerRef, node)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open, selected: active }}
        onAccessibilityEscape={() => {
          setOpen(false);
          triggerRef.current?.focus?.();
        }}
        onPress={() => setOpen((current) => !current)}
        style={discoveryTriggerStyle({ desktop, active })}
        interactionStyle={discoveryTriggerInteractionStyle({ desktop, active })}
      >
        <AppText role="nav">{label}</AppText>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <AppIcon name="chevronDown" size={16} />
        </View>
      </MotionPressable>
      {open ? (
        Platform.OS === 'web' ? (
          <OverlayPortal
            anchorRef={triggerRef}
            placement="bottom-start"
            testId="discovery-menu-dropdown"
            width={designTokens.layout.discoveryMenuWidth}
          >
            {dropdown}
          </OverlayPortal>
        ) : (
          dropdown
        )
      ) : null}
    </View>
  );
}

function DiscoveryDropdown({
  desktop,
  onNavigate,
}: DiscoveryDropdownProps) {
  const items: Array<{
    label: string;
    href: Href;
    icon: 'catalog' | 'user';
  }> = [
    {
      label: 'Работы',
      href: '/works',
      icon: 'catalog',
    },
    { label: 'Авторы', href: '/authors', icon: 'user' },
  ];

  return (
    <View
      accessibilityRole="menu"
      style={overlayPanelStyle({
        position: desktop ? undefined : 'absolute',
        top: desktop ? undefined : designTokens.size.touch,
        left: desktop ? undefined : 0,
        width: designTokens.layout.discoveryMenuWidth,
        gap: designTokens.space.x1,
        borderRadius: designTokens.radius.menu,
        borderColor: designTokens.color.border,
        padding: designTokens.space.x2,
      })}
    >
      {items.map((item) => (
        <Link key={item.label} href={item.href} asChild>
          <MotionPressable
            accessibilityRole="link"
            accessibilityLabel={item.label}
            onPress={onNavigate}
            preset="button"
            style={overlayMenuItemStyle({
              minHeight: designTokens.size.touch,
              borderRadius: designTokens.radius.small,
              paddingHorizontal: designTokens.space.x3,
              gap: designTokens.space.x3,
            })}
            interactionStyle={({ hovered, pressed }) => ({
              backgroundColor:
                hovered || pressed
                  ? designTokens.color.surfaceStrong
                  : 'transparent',
            })}
          >
            <AppIcon name={item.icon} size={18} />
            <AppText role="label">{item.label}</AppText>
          </MotionPressable>
        </Link>
      ))}
    </View>
  );
}
