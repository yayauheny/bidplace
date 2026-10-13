import { Link, type Href } from 'expo-router';
import { Linking, useWindowDimensions, View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import type { LegalDocumentId } from '@bidplace/contracts';

import {
  BidplaceMark,
  BidplaceWordmark,
} from '../../components/branding/BidplaceBrand';
import { getMobileCreateHref } from '../../components/layout/header-chrome';
import { useSellerCapability } from '../../hooks/use-seller-capability';
import { useAuth } from '../../providers/auth-provider';
import { AppText } from '../../components/ui';
import { MotionPressable } from '../../components/ui/MotionPressable';

const links: { id: LegalDocumentId; title: string }[] = [
  { id: 'agreement', title: 'Соглашение' },
  { id: 'privacy', title: 'Политика и cookies' },
  { id: 'data-consent', title: 'Согласие ПДн' },
  { id: 'author-rules', title: 'Правила авторов' },
  { id: 'prohibited', title: 'Запрещённое и правообладателям' },
];

const mainLinks: { href: Href; title: string }[] = [
  { href: '/works', title: 'Все работы' },
  { href: '/authors', title: 'Все авторы' },
  { href: '/profile?intro=1', title: 'Стать автором' },
];

const siteLinkStyle = {
  color: designTokens.color.inkStrong,
  fontFamily: designTokens.typography.sectionTitle.fontFamily,
  fontWeight: designTokens.typography.sectionTitle.fontWeight,
};

function FooterLink({
  href,
  title,
  site = false,
}: {
  href: Href;
  title: string;
  site?: boolean;
}) {
  return (
    <Link href={href} asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel={title}
        preset="button"
        hitSlop={site ? designTokens.space.x3 : undefined}
      >
        <AppText
          role={site ? 'nav' : 'metadata'}
          style={
            site
              ? siteLinkStyle
              : {
                  color: designTokens.color.textSubdued,
                  textDecorationLine: 'underline',
                }
          }
        >
          {title}
        </AppText>
      </MotionPressable>
    </Link>
  );
}

function ContactLink({ site = false }: { site?: boolean }) {
  return (
    <MotionPressable
      accessibilityRole="link"
      accessibilityLabel="Связаться с оператором bidplace"
      preset="button"
      hitSlop={site ? designTokens.space.x3 : undefined}
      onPress={() => {
        void Linking.openURL('mailto:work.evles@gmail.com');
      }}
    >
      <AppText
        role={site ? 'nav' : 'metadata'}
        style={
          site
            ? siteLinkStyle
            : {
                color: designTokens.color.textSubdued,
                textDecorationLine: 'underline',
              }
        }
      >
        {site ? 'Поддержка' : 'Связаться с оператором'}
      </AppText>
    </MotionPressable>
  );
}

/** Single source of legal destinations for auth and the public site footer. */
export function LegalFooter({
  variant = 'inline',
  createHref,
}: {
  variant?: 'inline' | 'site';
  createHref?: Href;
}) {
  if (variant === 'site') {
    return (
      <View style={{ gap: designTokens.space.x12 }}>
        <View style={{ flexDirection: 'row', gap: designTokens.space.x7 }}>
          <View style={{ flex: 1, minWidth: 0, gap: designTokens.space.x5 }}>
            <AppText role="nav" style={{ color: designTokens.color.gray2 }}>
              Основное
            </AppText>
            {mainLinks.map((link) => (
              <FooterLink key={link.title} {...link} site />
            ))}
            {createHref ? (
              <FooterLink href={createHref} title="Создать работу" site />
            ) : null}
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: designTokens.space.x5 }}>
            <AppText role="nav" style={{ color: designTokens.color.gray2 }}>
              Поддержка
            </AppText>
            {links.filter((item) => item.id !== 'privacy').map(({ id, title }) => (
              <FooterLink
                key={id}
                href={('/legal/' + id) as Href}
                title={id === 'agreement' ? 'Правила сервиса' : title}
                site
              />
            ))}
            <ContactLink site />
          </View>
        </View>
        <FooterLink
          href="/legal/privacy"
          title="Политика конфиденциальности и cookies"
        />
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: designTokens.space.x3,
        paddingVertical: designTokens.space.x4,
      }}
    >
      {links.map(({ id, title }) => (
        <FooterLink key={id} href={('/legal/' + id) as Href} title={title} />
      ))}
      <ContactLink />
    </View>
  );
}

/** Full-width site footer for scrollable public pages only (not auth or editors). */
export function PublicFooter({ inset = false }: { inset?: boolean }) {
  const { width } = useWindowDimensions();
  const auth = useAuth();
  const capability = useSellerCapability();
  const available =
    Math.min(width, designTokens.layout.phoneWidth) -
    designTokens.space.x12;
  // Figma logo group is 345.5 × 66: mark 54, gap 12, wordmark 279.5.
  const scale = Math.max(0, Math.min(1, available / 345.5));
  const createHref = getMobileCreateHref({
    isAuthenticated: auth.isAuthenticated,
    sellerStatus: capability.status,
    returnPath: '/',
  });

  return (
    <View
      style={{
        marginHorizontal: inset ? -designTokens.space.pageGutter : 0,
        paddingTop: 60,
      }}
    >
      <View
        style={{
          backgroundColor: designTokens.color.surfaceMuted,
          paddingHorizontal: designTokens.space.x6,
          paddingVertical: designTokens.space.x10,
          gap: designTokens.space.x10,
        }}
      >
        <View
          accessibilityLabel="bidplace"
          accessibilityRole="image"
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12 * scale,
          }}
        >
          <BidplaceMark size={54 * scale} />
          <BidplaceWordmark width={279.5 * scale} height={66 * scale} />
        </View>
        <LegalFooter variant="site" createHref={createHref} />
      </View>
    </View>
  );
}
