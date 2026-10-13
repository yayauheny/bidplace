import { View } from 'react-native';
import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import { AppText, ResilientRemoteImage } from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';
import { CreatorSocialActions } from './CreatorSocialActions';

export function CreatorIdentity({
  profile,
}: {
  profile: PortfolioWorkDetailResponse['author'];
}) {
  const country = /^[a-z]{2}$/i.test(profile.country)
    ? new Intl.DisplayNames(['ru'], { type: 'region' }).of(
        profile.country.toUpperCase(),
      )
    : profile.country;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: designTokens.space.x2,
        paddingHorizontal: designTokens.space.pageGutter,
        paddingBottom: designTokens.space.x5,
      }}
    >
      <View
        testID="creator-avatar"
        style={{
          width: 100,
          height: 100,
          borderRadius: designTokens.radius.pill,
          overflow: 'hidden',
        }}
      >
        <ResilientRemoteImage
          uri={getApiAssetUrl(profile.profilePhotoUrl)}
          component="AuthorPhoto"
          accessibilityLabel={`Фото автора ${profile.fullName}`}
          fallbackLabel={`Фото автора недоступно: ${profile.fullName}`}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          contentPosition="top"
        />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: designTokens.space.x2 }}>
        <View testID="creator-meta" style={{ gap: designTokens.space.x1 }}>
          <AppText role="profileHeading" numberOfLines={2}>
            {profile.fullName}
          </AppText>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: designTokens.space.x1,
            }}
          >
            <AppText role="bodySmall" tone="secondary">
              {profile.city || country}
            </AppText>
            <AppText role="bodySmall" tone="secondary">·</AppText>
            <AppText
              testID="creator-handle"
              role="bodySmall"
              tone="secondary"
              numberOfLines={1}
            >
              @{profile.slug}
            </AppText>
          </View>
        </View>
        <View testID="creator-actions">
          <CreatorSocialActions profile={profile} />
        </View>
      </View>
    </View>
  );
}
