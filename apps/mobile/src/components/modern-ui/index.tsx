import type { ReactNode } from 'react';
import { useState } from 'react';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type TextInputProps,
} from 'react-native';

import type { publicProductListItemSchema } from '@bidplace/contracts';
import type { z } from 'zod';

import { getApiUrl } from '../../lib/environment';
import {
  modernColors,
  modernFonts,
  modernRadius,
  modernSpacing,
} from '../../theme/modern-tokens';
import { BrandLogo } from '../layout/BrandLogo';

type TextRole =
  | 'display'
  | 'screenTitle'
  | 'sectionTitle'
  | 'body'
  | 'bodySmall'
  | 'metadata'
  | 'caption'
  | 'numeric';

type AppTextProps = {
  children: ReactNode;
  role?: TextRole;
  color?: string;
  numberOfLines?: number;
  style?: object;
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
};

const textStyles: Record<TextRole, object> = {
  display: { fontFamily: modernFonts.sansStrong, fontSize: 32, lineHeight: 38, letterSpacing: -0.45 },
  screenTitle: { fontFamily: modernFonts.sansStrong, fontSize: 28, lineHeight: 34, letterSpacing: -0.3 },
  sectionTitle: { fontFamily: modernFonts.sansStrong, fontSize: 20, lineHeight: 26 },
  body: { fontFamily: modernFonts.sans, fontSize: 17, lineHeight: 26 },
  bodySmall: { fontFamily: modernFonts.sans, fontSize: 15, lineHeight: 22 },
  metadata: { fontFamily: modernFonts.mono, fontSize: 12, lineHeight: 16, letterSpacing: 0.36 },
  caption: { fontFamily: modernFonts.mono, fontSize: 11, lineHeight: 15, letterSpacing: 0.66, textTransform: 'uppercase' },
  numeric: { fontFamily: modernFonts.mono, fontSize: 16, lineHeight: 20, fontVariant: ['tabular-nums'] },
};

export function AppText({
  children,
  role = 'body',
  color = modernColors.ink,
  numberOfLines,
  style,
  accessibilityLiveRegion,
}: AppTextProps) {
  return (
    <Text
      numberOfLines={numberOfLines}
      accessibilityLiveRegion={accessibilityLiveRegion}
      style={[textStyles[role], { color }, style]}
    >
      {children}
    </Text>
  );
}

type ButtonProps = {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  fullWidth?: boolean;
};

function ModernButton({
  children,
  onPress,
  disabled,
  loading,
  accessibilityLabel,
  fullWidth = true,
  variant,
}: ButtonProps & { variant: 'primary' | 'secondary' | 'text' }) {
  const inactive = Boolean(disabled || loading);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: inactive, busy: Boolean(loading) }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        fullWidth ? styles.buttonFull : undefined,
        variant === 'primary'
          ? styles.primaryButton
          : variant === 'secondary'
            ? styles.secondaryButton
            : styles.textButton,
        (pressed || inactive) && styles.buttonPressed,
      ]}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? modernColors.surface : modernColors.ink} /> : null}
      <AppText
        role="metadata"
        color={variant === 'primary' ? modernColors.surface : modernColors.ink}
        style={variant === 'text' ? styles.textButtonLabel : styles.buttonLabel}
      >
        {children}
      </AppText>
    </Pressable>
  );
}

export function PrimaryButton(props: ButtonProps) {
  return <ModernButton {...props} variant="primary" />;
}

export function SecondaryButton(props: ButtonProps) {
  return <ModernButton {...props} variant="secondary" />;
}

export function TextButton(props: ButtonProps) {
  return <ModernButton {...props} variant="text" />;
}

export function MetadataChip({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'accent' | 'success' }) {
  const color = tone === 'accent' ? modernColors.accent : tone === 'success' ? modernColors.success : modernColors.inkSoft;
  return (
    <View style={styles.chip}>
      <AppText role="metadata" color={color}>{children}</AppText>
    </View>
  );
}

type ModernFieldProps = {
  label: string;
  description?: string;
  error?: string;
} & TextInputProps;

export function ModernField({ label, description, error, multiline, style, ...props }: ModernFieldProps) {
  return (
    <View style={styles.field}>
      <AppText role="metadata">{label}</AppText>
      {description ? <AppText role="bodySmall" color={modernColors.textSecondary}>{description}</AppText> : null}
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={modernColors.textMuted}
        style={[styles.input, multiline && styles.inputMultiline, error ? styles.inputError : undefined, style]}
      />
      {error ? <AppText role="bodySmall" color={modernColors.danger}>{error}</AppText> : null}
    </View>
  );
}

export function AppImage({ uri, alt, ratio = 4 / 5, style }: { uri?: string | null; alt: string; ratio?: number; style?: object }) {
  return (
    <View accessibilityLabel={alt} style={[styles.imageFrame, { aspectRatio: ratio }, style]}>
      {uri ? <Image source={{ uri }} contentFit="cover" transition={180} style={StyleSheet.absoluteFill} accessibilityLabel={alt} /> : <AppText role="metadata" color={modernColors.textMuted}>Нет изображения</AppText>}
    </View>
  );
}

type ProductListItem = z.infer<typeof publicProductListItemSchema>;

export function AuctionCard({ product, listing, sellerProfile }: ProductListItem) {
  const image = product.images[0];
  const imageUri = image ? `${getApiUrl()}${image.url}` : null;
  const status = listing?.status === 'LIVE' ? 'Торги идут' : listing?.status === 'SCHEDULED' ? 'Скоро' : listing?.status === 'ENDED' ? 'Завершено' : null;
  return (
    <Link href={`/product/${product.publicId}`} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${product.title ?? 'Предмет'} — ${sellerProfile.fullName}`}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <AppImage uri={imageUri} alt={product.title ?? 'Предмет'} />
        <View style={styles.cardMeta}>
          <AppText role="metadata" color={modernColors.textSecondary} numberOfLines={1}>{sellerProfile.fullName}</AppText>
          <AppText role="bodySmall" numberOfLines={2} style={styles.cardTitle}>{product.title ?? 'Предмет'}</AppText>
          {listing ? <View style={styles.cardPrice}><AppText role="numeric">{listing.currentPrice} BYN</AppText>{status ? <AppText role="caption" color={listing.status === 'LIVE' ? modernColors.accent : modernColors.textSecondary}>{status}</AppText> : null}</View> : null}
        </View>
      </Pressable>
    </Link>
  );
}

export function ContentTabs({ items, children }: { items: readonly string[]; children: (active: string) => ReactNode }) {
  const [active, setActive] = useState(items[0]);
  return (
    <View style={styles.tabsRoot}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsList}>
        {items.map((item) => (
          <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: active === item }} onPress={() => setActive(item)} style={[styles.tab, active === item && styles.tabActive]}>
            <AppText role="metadata" color={active === item ? modernColors.surface : modernColors.ink}>{item}</AppText>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.tabPanel}>{children(active)}</View>
    </View>
  );
}

export function BottomActionBar({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  return <View style={styles.bottomAction}><View style={styles.bottomSummary}>{summary}</View><View style={styles.bottomControl}>{children}</View></View>;
}

export function ModernSection({ eyebrow, title, children }: { eyebrow?: string; title?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      {eyebrow ? <AppText role="caption" color={modernColors.textSecondary}>{eyebrow}</AppText> : null}
      {title ? <AppText role="sectionTitle">{title}</AppText> : null}
      {children}
    </View>
  );
}

export function ModernScreen({ children, mode = 'public', width = 'content' }: { children: ReactNode; mode?: 'public' | 'seller'; width?: 'content' | 'form' | 'wide' }) {
  const { width: viewportWidth } = useWindowDimensions();
  const desktop = viewportWidth >= 1025;
  const links = mode === 'seller'
    ? [{ label: 'Каталог', href: '/' as const }, { label: 'Продавать', href: '/profile' as const }]
    : [{ label: 'Каталог', href: '/' as const }, { label: 'Покупки', href: '/me/activity' as const }];
  const maxWidth = width === 'form' ? 760 : width === 'wide' ? 1280 : 980;
  const navigation = (
    <View style={styles.rail}>
      <BrandLogo compact={desktop} />
      <View style={styles.railLinks}>
        {links.map((item) => <Link key={item.href} href={item.href} asChild><Pressable accessibilityRole="link" style={({ pressed }) => [styles.navButton, pressed && styles.buttonPressed]}><AppText role="metadata">{item.label}</AppText></Pressable></Link>)}
      </View>
    </View>
  );
  const mobileNavigation = (
    <View style={styles.mobileDock} accessibilityRole="tablist">
      {links.map((item) => <Link key={item.href} href={item.href} asChild><Pressable accessibilityRole="tab" accessibilityLabel={item.label} style={({ pressed }) => [styles.dockButton, pressed && styles.buttonPressed]}><AppText role="caption">{item.label}</AppText></Pressable></Link>)}
    </View>
  );
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={desktop ? styles.desktopShell : styles.mobileShell}>
        {desktop ? navigation : null}
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.content, !desktop && styles.mobileContent, { maxWidth }]}>{children}</View>
        </ScrollView>
        {!desktop ? mobileNavigation : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: modernColors.canvas },
  desktopShell: { flex: 1, flexDirection: 'row' },
  mobileShell: { flex: 1 },
  rail: { width: 92, alignItems: 'center', paddingVertical: modernSpacing.xl, borderRightWidth: 1, borderRightColor: modernColors.border, backgroundColor: modernColors.surface, gap: modernSpacing.section },
  railLinks: { gap: modernSpacing.md, alignItems: 'center' },
  navButton: { minWidth: 44, minHeight: 44, paddingHorizontal: modernSpacing.sm, alignItems: 'center', justifyContent: 'center', borderRadius: modernRadius.control },
  scroll: { flexGrow: 1 },
  content: { width: '100%', alignSelf: 'center', paddingHorizontal: modernSpacing.page, paddingVertical: modernSpacing.section, gap: modernSpacing.section },
  mobileContent: { paddingBottom: 108 },
  mobileDock: { position: 'absolute', bottom: modernSpacing.lg, alignSelf: 'center', flexDirection: 'row', gap: modernSpacing.xs, padding: modernSpacing.sm, borderRadius: modernRadius.pill, borderWidth: 1, borderColor: modernColors.border, backgroundColor: modernColors.surface },
  dockButton: { minWidth: 72, minHeight: 44, paddingHorizontal: modernSpacing.sm, borderRadius: modernRadius.pill, alignItems: 'center', justifyContent: 'center' },
  button: { minHeight: 56, borderRadius: modernRadius.button, paddingHorizontal: modernSpacing.xl, flexDirection: 'row', gap: modernSpacing.sm, alignItems: 'center', justifyContent: 'center' },
  buttonFull: { width: '100%' }, primaryButton: { backgroundColor: modernColors.ink }, secondaryButton: { backgroundColor: modernColors.surface, borderWidth: 1, borderColor: modernColors.border }, textButton: { minHeight: 44, paddingHorizontal: 0, alignSelf: 'flex-start' }, buttonPressed: { opacity: 0.72 }, buttonLabel: { textTransform: 'uppercase' }, textButtonLabel: { textDecorationLine: 'underline' },
  chip: { alignSelf: 'flex-start', borderWidth: 1, borderColor: modernColors.border, borderRadius: modernRadius.pill, paddingHorizontal: modernSpacing.md, paddingVertical: modernSpacing.sm },
  field: { gap: modernSpacing.sm }, input: { minHeight: 52, borderWidth: 1, borderColor: modernColors.border, borderRadius: modernRadius.control, backgroundColor: modernColors.surface, paddingHorizontal: modernSpacing.lg, color: modernColors.ink, fontFamily: modernFonts.sans, fontSize: 16, lineHeight: 22 }, inputMultiline: { minHeight: 132, paddingTop: modernSpacing.md, textAlignVertical: 'top' }, inputError: { borderColor: modernColors.danger },
  imageFrame: { overflow: 'hidden', borderRadius: modernRadius.image, backgroundColor: modernColors.placeholder, alignItems: 'center', justifyContent: 'center' },
  card: { gap: modernSpacing.md }, cardPressed: { opacity: 0.82 }, cardMeta: { gap: modernSpacing.xs }, cardTitle: { fontFamily: modernFonts.sansStrong, color: modernColors.ink }, cardPrice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: modernSpacing.sm, marginTop: modernSpacing.xs },
  tabsRoot: { gap: modernSpacing.lg }, tabsList: { gap: modernSpacing.sm }, tab: { minHeight: 44, borderRadius: modernRadius.pill, backgroundColor: modernColors.chip, paddingHorizontal: modernSpacing.lg, alignItems: 'center', justifyContent: 'center' }, tabActive: { backgroundColor: modernColors.ink }, tabPanel: { borderTopWidth: 1, borderTopColor: modernColors.border, paddingTop: modernSpacing.xl },
  bottomAction: { borderWidth: 1, borderColor: modernColors.border, backgroundColor: modernColors.surface, borderRadius: modernRadius.panel, padding: modernSpacing.lg, gap: modernSpacing.md }, bottomSummary: { gap: modernSpacing.xs }, bottomControl: { width: '100%' },
  section: { gap: modernSpacing.md, paddingBottom: modernSpacing.section, borderBottomWidth: 1, borderBottomColor: modernColors.border },
});
