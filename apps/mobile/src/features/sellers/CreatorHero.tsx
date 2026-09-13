import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';
import { AppText, ResilientRemoteImage } from '../../components/ui';
import { AuthorAtmosphere } from '../../components/figma/AuthorAtmosphere';
import { FigmaChip } from '../../components/figma/FigmaChip';
import { BrandLogo } from '../../components/layout/BrandLogo';
import { getApiAssetUrl } from '../../lib/environment';
import { CreatorSocialActions } from './CreatorSocialActions';
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
        overflow: 'hidden',
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
          gap: designTokens.space.authorSectionGap,
          paddingHorizontal: designTokens.space.pageGutter,
          paddingTop: designTokens.space.authorLogoTop,
          zIndex: 1,
        }}
      >
        <View
          aria-hidden={compact}
          style={{
            visibility: compact ? 'hidden' : 'visible',
            marginBottom:
              designTokens.space.authorLogoGap -
              designTokens.space.authorSectionGap,
          }}
        >
          <BrandLogo profile />
        </View>
        <View
          style={{
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
            />
          </View>
          <View style={{ alignItems: 'center', gap: designTokens.space.x1 }}>
            <View testID="creator-handle">
              <AppText
                role="profileHandle"
                style={{ textAlign: 'center', flexShrink: 1 }}
              >
                @{profile.slug}
              </AppText>
            </View>
            <View
              aria-hidden={compact}
              style={{
                visibility: compact ? 'hidden' : 'visible',
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
                {[profile.city, country].filter(Boolean).join(', ')}
              </AppText>
            </View>
          </View>
        </View>
        {tags.length > 0 ? (
          <View
            aria-hidden={compact}
            style={{
              visibility: compact ? 'hidden' : 'visible',
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
          <CreatorSocialActions profile={profile} actions={actions} />
        </View>
      </View>
    </View>
  );
}
