import { useState } from 'react';

import { Platform, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import {
  AppIcon,
  AppText,
  MotionPressable,
  ResilientRemoteImage,
} from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';

import { CreatorSocialLink } from './CreatorSocialLink';

export type CreatorHeroProps = {
  profile: {
    fullName: string;
    profilePhotoUrl: string;
    shortDescription: string;
    telegramUrl: string | null;
    instagramUrl: string | null;
    websiteUrl: string | null;
  };
  slug: string;
};

export function CreatorHero({ profile, slug }: CreatorHeroProps) {
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>(
    'idle',
  );

  const copyProfileLink = () => {
    if (
      Platform.OS !== 'web' ||
      typeof window === 'undefined' ||
      !navigator.clipboard
    ) {
      setCopyState('error');
      return;
    }

    void navigator.clipboard
      .writeText(new URL(`/seller/${slug}`, window.location.origin).toString())
      .then(() => setCopyState('success'))
      .catch(() => setCopyState('error'));
  };

  return (
    <View
      style={{
        minHeight: 500,
        alignItems: 'center',
        gap: 18,
        paddingTop: 64,
        paddingBottom: 72,
        backgroundColor: 'transparent',
      }}
    >
      <ResilientRemoteImage
        uri={getApiAssetUrl(profile.profilePhotoUrl)}
        component="AuthorPhoto"
        accessibilityLabel={`Фото автора ${profile.fullName}`}
        fallbackLabel={`Фото автора недоступно: ${profile.fullName}`}
        style={{ width: 120, height: 120, borderRadius: 60 }}
        contentFit="cover"
      />

      <View style={{ alignItems: 'center', gap: 6 }}>
        <AppText
          accessibilityRole="header"
          role="display"
          style={{
            fontFamily: 'Inter_700Bold',
            fontSize: 48,
            lineHeight: 50,
            letterSpacing: -1,
            textAlign: 'center',
          }}
        >
          {profile.fullName}
        </AppText>

        {Platform.OS === 'web' ? (
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel={`Скопировать ссылку на профиль ${profile.fullName}`}
            onPress={copyProfileLink}
            preset="button"
            style={{
              minHeight: 28,
              flexDirection: 'row',
              alignItems: 'center',
              gap: designTokens.space.x2,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: designTokens.color.border,
              backgroundColor: designTokens.color.surfaceMuted,
              paddingHorizontal: 9,
            }}
          >
            <AppText role="label" tone="secondary" style={{ fontSize: 15 }}>
              @{slug}
            </AppText>
            <AppIcon name="copy" size={14} color={designTokens.color.ink} />
          </MotionPressable>
        ) : (
          <AppText role="label" tone="secondary">
            @{slug}
          </AppText>
        )}

        {copyState === 'success' ? (
          <AppText role="caption" tone="success">
            Ссылка скопирована.
          </AppText>
        ) : null}

        {copyState === 'error' ? (
          <AppText role="caption" tone="danger">
            Не удалось скопировать ссылку.
          </AppText>
        ) : null}
      </View>

      <View
        style={{
          height: 28,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {profile.telegramUrl ? (
          <CreatorSocialLink
            href={profile.telegramUrl}
            icon="send"
            label="Telegram автора"
          />
        ) : null}
        {profile.instagramUrl ? (
          <CreatorSocialLink
            href={profile.instagramUrl}
            icon="instagram"
            label="Instagram автора"
          />
        ) : null}
        {profile.websiteUrl ? (
          <CreatorSocialLink
            href={profile.websiteUrl}
            icon="globe"
            label="Сайт автора"
          />
        ) : null}
      </View>

      <AppText
        role="body"
        tone="secondary"
        style={{ maxWidth: 680, textAlign: 'center' }}
      >
        {profile.shortDescription}
      </AppText>
    </View>
  );
}

