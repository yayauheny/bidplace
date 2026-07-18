import { Link } from 'expo-router';
import { Pressable } from 'react-native';
import { Text, YStack } from 'tamagui';

import { mobileSpacing } from '../../theme/tokens';
import { AppSheet } from '../ui';

type MobileNavigationDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileHref: '/profile' | '/login';
};

const navItems = [
  { label: 'Главная', href: '/' as const },
  { label: 'Каталог', href: '/catalog' as const },
  { label: 'Коллекции', href: '/catalog' as const },
  { label: 'О нас', href: '/catalog' as const },
];

export function MobileNavigationDrawer({
  open,
  onOpenChange,
  profileHref,
}: MobileNavigationDrawerProps) {
  return (
    <AppSheet open={open} onOpenChange={onOpenChange} snapPoints={[95]}>
      <YStack style={{ gap: mobileSpacing[4], paddingTop: mobileSpacing[2] }}>
        {navItems.map((item) => (
          <Link key={`${item.label}-${item.href}`} href={item.href} asChild>
            <Pressable onPress={() => onOpenChange(false)}>
              <Text color="$text" fontSize={28} lineHeight={34} fontFamily="$heading">
                {item.label}
              </Text>
            </Pressable>
          </Link>
        ))}
        <Link href={profileHref} asChild>
          <Pressable onPress={() => onOpenChange(false)}>
            <Text color="$textMuted" style={{ fontSize: 14, letterSpacing: 1, textTransform: 'uppercase' }}>
              Профиль
            </Text>
          </Pressable>
        </Link>
      </YStack>
    </AppSheet>
  );
}
