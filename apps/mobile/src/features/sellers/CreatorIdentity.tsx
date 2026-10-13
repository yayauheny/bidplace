import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';
import { AppText, ResilientRemoteImage } from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';
import { CreatorSocialActions } from './CreatorSocialActions';

export function CreatorIdentity({
  profile,
  actions,
  tags,
}: {
  profile: PortfolioWorkDetailResponse['author'];
  actions: ReactNode;
  tags?: ReactNode;
}) {
  const country = /^[a-z]{2}$/i.test(profile.country)
    ? new Intl.DisplayNames(['ru'], { type: 'region' }).of(
        profile.country.toUpperCase(),
      )
    : profile.country;

  return (
    <View style={{ alignSelf: 'stretch', alignItems: 'center' }}>
      <View
        testID="creator-avatar"
        style={{
          width: designTokens.size.avatar,
          height: designTokens.size.avatar,
        }}
      >
        <ResilientRemoteImage
          uri={getApiAssetUrl(profile.profilePhotoUrl)}
          component="AuthorPhoto"
          accessibilityLabel={`Фото автора ${profile.fullName}`}
          fallbackLabel={`Фото автора недоступно: ${profile.fullName}`}
          style={{
            width: '100%',
            height: '100%',
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
          marginTop: designTokens.space.authorIdentityGap,
        }}
      >
        <View
          testID="creator-handle"
          style={{ alignSelf: 'center', maxWidth: '100%', minWidth: 0 }}
        >
          <AppText role="profileHandle" numberOfLines={1}>
            @{profile.slug}
          </AppText>
        </View>
        <View
          testID="creator-meta"
          style={{
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
          <AppText role="profileMetadata">{profile.city || country}</AppText>
        </View>
      </View>
      {tags ? (
        <View
          style={{
            alignSelf: 'stretch',
            marginTop: designTokens.space.authorSectionGap,
          }}
        >
          {tags}
        </View>
      ) : null}
      <View
        testID="creator-actions"
        style={{ marginTop: designTokens.space.authorSectionGap }}
      >
        <CreatorSocialActions profile={profile} actions={actions} />
      </View>
    </View>
  );
}
