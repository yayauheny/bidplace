import { Link, useRouter } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';
import { designTokens, figmaButtonTokens } from '@bidplace/design-tokens';

import logo from '../../../assets/branding/bidplace-logo-light.svg';
import { useAppTheme } from '../../providers/theme-provider';
import { FigmaButton } from '../figma/FigmaButton';
import { FigmaIcon } from '../figma/FigmaIcon';
import { FigmaIconButton } from '../figma/FigmaIconButton';
import { SEARCH_DOCK_BUTTON_ID } from '../figma/floating-dock';
import { AppText } from '../ui/AppText';
import { MotionPressable } from '../ui/MotionPressable';
import { useAppNavigation } from './use-app-navigation';

// Exact header frame 4980:15230 / brand 5065:20913. Flexible gaps adapt below 1800px.
const header = {
  height: 68,
  searchHeight: 48,
  logoWidth: 115.1696,
  logoHeight: 22,
};

export function DesktopHeader({ active }: { active: boolean }) {
  const palette = useAppTheme();
  const router = useRouter();
  const navigation = useAppNavigation('desktop-navigation');
  return (
    <View
      testID={active ? 'desktop-navigation' : undefined}
      role={active ? 'navigation' : undefined}
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
      {...(!active ? { inert: true } : {})}
      accessibilityLabel="Основная навигация"
      style={[
        styles.surface,
        { backgroundColor: palette.canvas, borderBottomColor: palette.border },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.group}>
          <Link href="/" asChild>
            <MotionPressable
              accessibilityRole="link"
              accessibilityLabel="bidplace — на главную"
              style={styles.brand}
            >
              <Image
                source={logo}
                accessible={false}
                style={{ width: header.logoWidth, height: header.logoHeight }}
              />
            </MotionPressable>
          </Link>
          {(['works', 'authors'] as const).map((route) => (
            <Link
              key={route}
              href={route === 'works' ? '/works' : '/authors'}
              asChild
            >
              <MotionPressable
                accessibilityRole="link"
                style={styles.link}
                {...{
                  'aria-current': navigation.pathname.startsWith(`/${route}`)
                    ? 'page'
                    : undefined,
                }}
              >
                <AppText style={figmaButtonTokens.typography}>
                  {route === 'works' ? 'Работы' : 'Авторы'}
                </AppText>
              </MotionPressable>
            </Link>
          ))}
        </View>
        <MotionPressable
          nativeID={active ? SEARCH_DOCK_BUTTON_ID : undefined}
          accessibilityRole="button"
          accessibilityLabel="Поиск"
          onPress={() => navigation.search.open()}
          style={[
            styles.search,
            {
              borderColor: palette.fieldLabel,
              backgroundColor: palette.canvas,
            },
          ]}
          {...{ 'aria-haspopup': 'dialog' }}
        >
          <FigmaIcon name="search-01" size={18} color={palette.fieldIcon} />
          <AppText role="searchPrompt" tone="subdued" numberOfLines={1}>
            Поиск
          </AppText>
        </MotionPressable>
        <View style={[styles.group, styles.actions]}>
          <FigmaIconButton
            icon="user"
            label="Профиль"
            onPress={() => {
              navigation.rememberAuthOpener('Профиль');
              // Profile uses the same destination and auth policy as the mobile dock.
              router.push(navigation.profileHref);
            }}
          />
          {!navigation.isAdmin ? (
            <FigmaButton
              label="Создать"
              variant="outline"
              icon="plus"
              onPress={() => navigation.create('Создать')}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    height: header.height,
    borderBottomWidth: designTokens.size.fieldBorder,
    flexShrink: 0,
  },
  row: {
    height: '100%',
    width: '100%',
    maxWidth: designTokens.layout.contentMax + 2 * designTokens.layout.gutter,
    paddingHorizontal: designTokens.layout.gutter,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 'clamp(20px, 8vw, 120px)',
  },
  group: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    gap: designTokens.space.x5,
    alignItems: 'center',
  },
  brand: {
    minHeight: designTokens.size.touch,
    justifyContent: 'center',
    flexShrink: 0,
  },
  link: { minHeight: designTokens.size.touch, justifyContent: 'center' },
  search: {
    flex: 1,
    minWidth: 0,
    height: header.searchHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.space.x2,
    paddingHorizontal: designTokens.space.x3,
    borderWidth: designTokens.size.fieldBorder,
    borderRadius: designTokens.radius.pill,
  },
  actions: { justifyContent: 'flex-end', gap: designTokens.space.x2 },
});
