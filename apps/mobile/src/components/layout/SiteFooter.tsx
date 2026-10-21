import { Link, useIsFocused, type Href } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

import { useAppTheme } from '../../providers/theme-provider';
import { BidplaceLogo } from '../branding/BidplaceLogo';
import { AppText } from '../ui/AppText';
import { MotionPressable } from '../ui/MotionPressable';
import {
  footerLegalLinks,
  footerSupportLinks,
  operatorContact,
} from './footer-links';
import { useWideLayout } from './public-navigation';
import { PageColumn } from './PageColumn';
import { useAppNavigation } from './use-app-navigation';

// Figma5065:21196 /4980:16299. Data/legal links follow the current MVP contract.
const metrics = {
  wideGap: 64,
  columnWidth: 200,
  logoWide: 484,
  logoCompact: 345.509,
};

export function SiteFooter() {
  const palette = useAppTheme();
  const active = useIsFocused();
  const wide = useWideLayout();
  const navigation = useAppNavigation('site-footer');
  const legal = (
    <View
      style={[
        styles.legal,
        { justifyContent: wide ? 'flex-start' : 'space-between' },
      ]}
    >
      {footerLegalLinks.map((link) => (
        <FooterLink key={link.href} {...link} legal />
      ))}
    </View>
  );
  return (
    <View
      testID={active ? 'site-footer' : undefined}
      role="contentinfo"
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
      {...(!active && Platform.OS === 'web' ? { inert: true } : {})}
      accessibilityLabel="Информация о bidplace"
      style={{ paddingTop: wide ? 80 : 60, width: '100%' }}
    >
      <View
        style={{
          backgroundColor: palette.surfaceMuted,
          paddingVertical: wide ? 80 : 40,
        }}
      >
        <PageColumn
          style={{
            paddingHorizontal: wide ? designTokens.layout.gutter : 24,
            gap: 48,
          }}
        >
          <View
            style={{
              flexDirection: wide ? 'row' : 'column',
              gap: 40,
              justifyContent: 'space-between',
            }}
          >
            <View
              style={{
                justifyContent: 'space-between',
                gap: 40,
                minWidth: 0,
                alignItems: wide ? 'flex-start' : 'center',
              }}
            >
              <Link href="/" asChild>
                <MotionPressable
                  accessibilityRole="link"
                  accessibilityLabel="bidplace — на главную"
                  style={{ maxWidth: '100%' }}
                >
                  <BidplaceLogo
                    width={wide ? metrics.logoWide : metrics.logoCompact}
                  />
                </MotionPressable>
              </Link>
              {wide ? legal : null}
            </View>
            <View
              style={{ flexDirection: 'row', gap: wide ? metrics.wideGap : 30 }}
            >
              <View
                style={[
                  styles.column,
                  wide ? { width: metrics.columnWidth } : { flex: 1 },
                ]}
              >
                <AppText
                  role="footerHeading"
                  style={{ color: palette.accountMeta }}
                >
                  Основное
                </AppText>
                <View style={styles.links}>
                  <FooterLink label="Все работы" href="/works" />
                  <FooterLink label="Все авторы" href="/authors" />
                  {!navigation.isAdmin ? (
                    <>
                      <FooterLink
                        label="Стать автором"
                        href={navigation.authorHref}
                        onPress={() =>
                          navigation.rememberAuthOpener('Стать автором')
                        }
                      />
                      <FooterLink
                        label="Создать работу"
                        onPress={() => navigation.create('Создать работу')}
                      />
                    </>
                  ) : null}
                </View>
              </View>
              <View
                style={[
                  styles.column,
                  wide ? { width: metrics.columnWidth } : { flex: 1 },
                ]}
              >
                <AppText
                  role="footerHeading"
                  style={{ color: palette.accountMeta }}
                >
                  Поддержка
                </AppText>
                <View style={styles.links}>
                  {footerSupportLinks.map((link) => (
                    <FooterLink key={link.href} {...link} />
                  ))}
                  <FooterLink
                    label="Связаться с оператором"
                    href={operatorContact}
                  />
                </View>
              </View>
            </View>
          </View>
          {!wide ? legal : null}
        </PageColumn>
      </View>
    </View>
  );
}

function FooterLink({
  label,
  href,
  onPress,
  legal = false,
}: {
  label: string;
  href?: Href;
  onPress?: () => void;
  legal?: boolean;
}) {
  const palette = useAppTheme();
  const control = (
    <MotionPressable
      accessibilityRole={href ? 'link' : 'button'}
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.link}
    >
      <AppText
        role={legal ? 'footerLegal' : 'footerLink'}
        style={{ color: legal ? palette.fieldLabel : palette.inkStrong }}
      >
        {label}
      </AppText>
    </MotionPressable>
  );
  return href ? (
    <Link href={href} asChild>
      {control}
    </Link>
  ) : (
    control
  );
}

const styles = StyleSheet.create({
  column: { minWidth: 0, gap: designTokens.space.x2 },
  links: { gap: 0 },
  link: {
    minHeight: designTokens.size.touch,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  legal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.space.x5,
    width: '100%',
  },
});
