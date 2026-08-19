import type { ReactNode } from 'react';

import { Link, type Href } from 'expo-router';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import {
  AppIcon,
  AppText,
  MotionPressable,
  ResilientRemoteImage,
} from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';

export function SurfacePanel({
  eyebrow,
  children,
}: {
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <View
      style={{
        gap: designTokens.space.x4,
        borderRadius: designTokens.radius.panel,
        borderWidth: 1,
        borderColor: designTokens.color.border,
        backgroundColor: designTokens.color.surface,
        padding: designTokens.space.x5,
      }}
    >
      {eyebrow ? (
        <AppText role="metadata" tone="secondary">
          {eyebrow}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

export function AboutAccordionRow({
  body,
  expanded,
  index,
  label,
  onToggle,
}: {
  body: ReactNode;
  expanded: boolean;
  index: number;
  label: string;
  onToggle: () => void;
}) {
  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: designTokens.color.border,
      }}
    >
      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel={`${String(index).padStart(2, '0')} ${label}`}
        accessibilityState={{ expanded }}
        onPress={onToggle}
        preset="button"
        style={{
          minHeight: 64,
          flexDirection: 'row',
          alignItems: 'center',
          gap: designTokens.space.x3,
          paddingHorizontal: designTokens.space.x3,
        }}
      >
        <AppText role="metadata" tone="secondary" style={{ width: 24 }}>
          {String(index).padStart(2, '0')}
        </AppText>
        <AppText role="label" style={{ flex: 1 }}>
          {label}
        </AppText>
        <AppIcon name={expanded ? 'minus' : 'plus'} size={16} />
      </MotionPressable>
      {expanded ? (
        <View
          nativeID={`product-about-section-${index}`}
          accessibilityRole="summary"
          style={{
            gap: designTokens.space.x3,
            paddingHorizontal: designTokens.space.x8,
            paddingBottom: designTokens.space.x5,
          }}
        >
          {body}
        </View>
      ) : null}
    </View>
  );
}

type ProductAboutAuthorProfile = {
  fullName: string;
  slug: string;
  profilePhotoUrl: string;
  shortDescription: string;
};

export function ProductAboutAuthorPanel({
  profile,
}: {
  profile: ProductAboutAuthorProfile;
}) {
  return (
    <View
      style={{
        width: 376,
        minHeight: 310,
        gap: designTokens.space.x4,
        paddingHorizontal: 28,
        paddingVertical: 24,
        borderRadius: designTokens.radius.aboutPanel,
        backgroundColor: designTokens.color.surfacePanel,
      }}
    >
      <AppText role="sectionTitle">Автор</AppText>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: designTokens.space.x3,
        }}
      >
        <ResilientRemoteImage
          uri={getApiAssetUrl(profile.profilePhotoUrl)}
          component="ProductAuthor"
          accessibilityLabel={`Фото автора: ${profile.fullName}`}
          fallbackLabel={`Фото автора недоступно: ${profile.fullName}`}
          style={{ width: 48, height: 48, borderRadius: 24 }}
          contentFit="cover"
        />
        <View style={{ flex: 1, gap: designTokens.space.x1 }}>
          <AppText role="label">{profile.fullName}</AppText>
          <AppText role="bodySmall" tone="secondary">
            @{profile.slug}
          </AppText>
        </View>
      </View>
      <AppText role="bodySmall" tone="secondary">
        {profile.shortDescription}
      </AppText>
      <Link
        href={
          { pathname: '/seller/[slug]', params: { slug: profile.slug } } as Href
        }
        asChild
      >
        <MotionPressable
          accessibilityRole="link"
          accessibilityLabel={`Открыть страницу автора ${profile.fullName}`}
          preset="button"
          style={{
            minHeight: designTokens.size.touch,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTopWidth: 1,
            borderTopColor: designTokens.color.border,
            paddingTop: designTokens.space.x3,
          }}
        >
          <AppText role="label">Страница автора</AppText>
          <AppIcon name="chevronRight" size={16} />
        </MotionPressable>
      </Link>
    </View>
  );
}

