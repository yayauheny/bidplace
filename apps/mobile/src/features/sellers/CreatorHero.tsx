import type { ReactNode } from 'react';
import { Platform, View } from 'react-native';
import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';
import { AppText, ResilientRemoteImage } from '../../components/ui';
import { AuthorAtmosphere } from '../../components/figma/AuthorAtmosphere';
import { FigmaChip } from '../../components/figma/FigmaChip';
import { BrandLogo } from '../../components/layout/BrandLogo';
import { getApiAssetUrl } from '../../lib/environment';
import { CreatorSocialActions } from './CreatorSocialActions';
import { webVisibilityStyle } from './web-visibility-style';
export type CreatorHeroProps = {
  profile: PortfolioWorkDetailResponse['author'];
  actions: ReactNode;
  compact?: boolean;
};
export function CreatorHero({
  profile,
  actions,
  compact = false,
}: CreatorHeroProps) {
  const country = /^[a-z]{2}$/i.test(profile.country)
    ? new Intl.DisplayNames(['ru'], { type: 'region' }).of(
        profile.country.toUpperCase(),
      )
    : profile.country;
  const tags = [
    ...new Set(
      profile.discipline
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ];
  return (
    <View
      testID="author-header"
      style={{
        overflow: 'visible',
        paddingBottom: designTokens.space.authorHeaderBottom,
      }}
    >
      <AuthorAtmosphere
        imageUrl={profile.profilePhotoUrl}
        fullName={profile.fullName}
      />
      <View
        style={{
          alignItems: 'center',
          alignSelf: 'center',
          width: '100%',
          maxWidth: designTokens.layout.phoneWidth,
          gap: designTokens.space.authorSectionGap,
          paddingHorizontal: designTokens.space.pageGutter,
          paddingTop: designTokens.space.logoTop,
          zIndex: 1,
        }}
      >
        <View
          aria-hidden={compact}
          testID="creator-fade-logo"
          style={{
            ...webVisibilityStyle(compact ? 'hidden' : 'visible'),
            marginBottom:
              designTokens.space.logoGap - designTokens.space.authorSectionGap,
          }}
        >
          <BrandLogo profile />
        </View>
        <View
          style={{
            alignSelf: 'stretch',
            alignItems: 'center',
            gap: designTokens.space.authorIdentityGap,
          }}
        >
          <View testID="creator-avatar">
            <ResilientRemoteImage
              uri={getApiAssetUrl(profile.profilePhotoUrl)}
              component="AuthorPhoto"
              accessibilityLabel={`Фото автора ${profile.fullName}`}
              fallbackLabel={`Фото автора недоступно: ${profile.fullName}`}
              style={{
                width: designTokens.size.avatar,
                height: designTokens.size.avatar,
                borderRadius: designTokens.radius.avatar,
              }}
              contentFit="cover"
              contentPosition="top"
            />
          </View>
          <View
            style={{
              alignSelf: 'stretch',
              alignItems: 'center',
              gap: designTokens.space.x1,
            }}
          >
            <View
              testID="creator-handle"
              style={{ alignSelf: 'stretch', position: 'relative' }}
            >
              <View
                testID="creator-handle-expanded"
                aria-hidden={compact}
                style={{ alignSelf: 'stretch' }}
              >
                <AppText
                  role="profileHandle"
                  numberOfLines={1}
                  style={{ textAlign: 'center', flexShrink: 1 }}
                >
                  @{profile.slug}
                </AppText>
              </View>
              {Platform.OS === 'web' ? (
                <View
                  testID="creator-handle-compact"
                  aria-hidden={!compact}
                  style={{ position: 'absolute', left: 0, top: 0 }}
                >
                  <AppText role="profileHandleCompact" numberOfLines={1}>
                    @{profile.slug}
                  </AppText>
                </View>
              ) : null}
            </View>
            <View
              aria-hidden={compact}
              testID="creator-fade-meta"
              style={{
                ...webVisibilityStyle(compact ? 'hidden' : 'visible'),
                flexDirection: 'row',
                alignItems: 'center',
                gap: designTokens.space.x2,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <AppText role="profileMetadata" style={{ textAlign: 'center' }}>
                {profile.fullName}
              </AppText>
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: designTokens.color.ink,
                }}
              />
              <AppText role="profileMetadata">
                {profile.city || country}
              </AppText>
            </View>
          </View>
        </View>
        {tags.length > 0 ? (
          <View
            aria-hidden={compact}
            testID="creator-fade-tags"
            style={{
              ...webVisibilityStyle(compact ? 'hidden' : 'visible'),
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: designTokens.space.authorChipGap,
              marginBottom:
                designTokens.space.socialGroupGap -
                designTokens.space.authorSectionGap,
            }}
          >
            {tags.map((tag) => (
              <FigmaChip key={tag} label={tag} tone="onGlass" size="profile" />
            ))}
          </View>
        ) : null}
        <View testID="creator-actions">
          <CreatorSocialActions
            profile={profile}
            actions={actions}
            compact={compact}
          />
        </View>
      </View>
    </View>
  );
}
