import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';
import { AppText, ResilientRemoteImage } from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';
import { controlLayoutTransition } from '../../lib/layout-transition';
import { CreatorSocialActions } from './CreatorSocialActions';

export function CreatorIdentity({
  profile,
  compact,
  actions,
  tags,
}: {
  profile: PortfolioWorkDetailResponse['author'];
  compact: boolean;
  actions: ReactNode;
  tags?: ReactNode;
}) {
  const avatarSize = compact
    ? designTokens.size.creatorCompactAvatar
    : designTokens.size.avatar;
  const handleOffset = compact
    ? (designTokens.size.creatorCompactAvatar -
        designTokens.typography.profileHandleCompact.lineHeight) /
      2
    : 0;
  const country = /^[a-z]{2}$/i.test(profile.country)
    ? new Intl.DisplayNames(['ru'], { type: 'region' }).of(
        profile.country.toUpperCase(),
      )
    : profile.country;

  return (
    <View
      style={
        compact
          ? {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: designTokens.stickyDock.actionHeight,
              flexDirection: 'row',
              alignItems: 'flex-start',
              paddingTop: designTokens.stickyDock.controlTop,
              paddingBottom: designTokens.space.x5,
              paddingHorizontal: designTokens.stickyDock.controlInset,
              zIndex: 2,
            }
          : {
              alignSelf: 'stretch',
              alignItems: 'center',
            }
      }
    >
      <Animated.View
        key="creator-avatar"
        testID="creator-avatar"
        layout={controlLayoutTransition}
        style={{ width: avatarSize, height: avatarSize }}
      >
        <ResilientRemoteImage
          uri={getApiAssetUrl(profile.profilePhotoUrl)}
          component="AuthorPhoto"
          accessibilityLabel={`Фото автора ${profile.fullName}`}
          fallbackLabel={`Фото автора недоступно: ${profile.fullName}`}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: compact
              ? designTokens.size.creatorCompactAvatar / 2
              : designTokens.radius.avatar,
          }}
          contentFit="cover"
          contentPosition="top"
        />
      </Animated.View>
      <View
        style={
          compact
            ? {
                flex: 1,
                minWidth: 0,
                marginLeft: designTokens.space.x2,
                marginTop: handleOffset,
              }
            : {
                alignSelf: 'stretch',
                alignItems: 'center',
                gap: designTokens.space.x1,
                marginTop: designTokens.space.authorIdentityGap,
              }
        }
      >
        <Animated.View
          key="creator-handle"
          testID="creator-handle"
          layout={controlLayoutTransition}
          style={
            compact
              ? { maxWidth: '100%', minWidth: 0 }
              : { alignSelf: 'center', maxWidth: '100%', minWidth: 0 }
          }
        >
          <AppText
            role={compact ? 'profileHandleCompact' : 'profileHandle'}
            numberOfLines={1}
          >
            @{profile.slug}
          </AppText>
        </Animated.View>
        {compact ? null : (
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
            <AppText role="profileMetadata">
              {profile.city || country}
            </AppText>
          </View>
        )}
      </View>
      {compact || !tags ? null : (
        <View
          style={{
            alignSelf: 'stretch',
            marginTop: designTokens.space.authorSectionGap,
          }}
        >
          {tags}
        </View>
      )}
      <Animated.View
        key="creator-actions"
        testID="creator-actions"
        layout={controlLayoutTransition}
        style={
          compact
            ? { marginLeft: designTokens.space.x3 }
            : { marginTop: designTokens.space.authorSectionGap }
        }
      >
        <CreatorSocialActions
          profile={profile}
          actions={actions}
          compact={compact}
        />
      </Animated.View>
    </View>
  );
}
