import { Link, usePathname } from 'expo-router';
import { Pressable } from 'react-native';
import { Text, XStack } from 'tamagui';

import { fontFamilies, mobileSpacing } from '../../theme/tokens';

const navItems = [
  { label: 'Главная', href: '/' as const },
  { label: 'Мои покупки', href: '/me/activity' as const },
];

export function DesktopNavigation() {
  const pathname = usePathname();

  return (
    <XStack style={{ alignItems: 'center', gap: mobileSpacing[4] }}>
      {navItems.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== '/' && pathname.startsWith(item.href));

        return (
          <Link key={`${item.label}-${item.href}`} href={item.href} asChild>
            <Pressable accessibilityRole="link">
              <Text
                color={active ? '$text' : '$textMuted'}
                style={{
                  fontFamily: fontFamilies.sansMedium,
                  fontSize: 12,
                  lineHeight: 16,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  textDecorationLine: active ? 'underline' : 'none',
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          </Link>
        );
      })}
    </XStack>
  );
}
