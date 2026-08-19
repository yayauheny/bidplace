import { Link, type Href } from 'expo-router';
import { ViewStyle } from 'react-native';

import { AppText, MotionPressable } from '../ui';

import {
  headerNavLinkInteractionStyle,
  headerNavLinkStyle,
} from './header-layout';

type HeaderItem = { label: string; href: Href };

export function HeaderNavigationLink({
  active,
  desktop,
  item,
  onPress,
}: {
  active: boolean;
  desktop: boolean;
  item: HeaderItem;
  onPress?: () => void;
}) {
  return (
    <Link href={item.href} asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel={item.label}
        aria-current={active ? 'page' : undefined}
        onPress={onPress}
        preset="button"
        style={headerNavLinkStyle({ desktop, active }) as ViewStyle}
        interactionStyle={headerNavLinkInteractionStyle({ desktop, active })}
      >
        <AppText role="nav" numberOfLines={1}>
          {item.label}
        </AppText>
      </MotionPressable>
    </Link>
  );
}

