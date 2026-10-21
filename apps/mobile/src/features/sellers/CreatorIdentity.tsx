import { Platform, ScrollView, View } from 'react-native';
import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import { useAppTheme } from '../../providers/theme-provider';
import { useDesktopNavigation } from '../../components/layout/public-navigation';
import { FigmaButton } from '../../components/figma/FigmaButton';
import { webFilterBlur } from '../../components/figma/web-backdrop';

import { AppText, ResilientRemoteImage } from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';
import { CreatorSocialActions } from './CreatorSocialActions';

export function CreatorIdentity({
  profile,
  onSubscribe,
}: {
  profile: PortfolioWorkDetailResponse['author'];
  onSubscribe: () => void;
}) {
  const desktop = useDesktopNavigation();
  const palette = useAppTheme();
  // Figma4306:8453 /4861:7803: same identity, no remount on presentation changes.
  const avatarSize = desktop ? 140 : 100;
  const metaRole = desktop ? 'authorMetaWide' : 'authorMeta';
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
        gap: desktop ? designTokens.space.x5 : designTokens.space.x2,
        paddingBottom: desktop ? 50 : designTokens.space.x5,
      }}
    >
      <View
        testID="creator-avatar"
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: designTokens.radius.pill,
        }}
      >
        <View
          aria-hidden
          accessible={false}
          style={{
            position: 'absolute',
            width: avatarSize,
            height: avatarSize,
            borderRadius: designTokens.radius.pill,
            opacity: 0.5,
            pointerEvents: 'none',
            ...(Platform.OS === 'web' ? webFilterBlur(15) : {}),
          }}
        >
          <ResilientRemoteImage
            uri={getApiAssetUrl(profile.profilePhotoUrl)}
            component="AuthorPhoto"
            accessibilityLabel=""
            fallbackLabel=""
            blurRadius={Platform.OS === 'web' ? undefined : 15}
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: designTokens.radius.pill,
            }}
            contentFit="cover"
            contentPosition="top"
          />
        </View>
        <ResilientRemoteImage
          uri={getApiAssetUrl(profile.profilePhotoUrl)}
          component="AuthorPhoto"
          accessibilityLabel={`Фото автора ${profile.fullName}`}
          fallbackLabel={`Фото автора недоступно: ${profile.fullName}`}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: designTokens.radius.pill,
          }}
          contentFit="cover"
          contentPosition="top"
        />
      </View>
      <View
        style={{
          flex: 1,
          minWidth: 0,
          gap: desktop ? designTokens.space.x4 : designTokens.space.x2,
        }}
      >
        <View testID="creator-meta" style={{ gap: designTokens.space.x1 }}>
          <AppText
            role={desktop ? 'creatorNameWide' : 'creatorName'}
            tone="strong"
            numberOfLines={2}
          >
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
            <AppText role={metaRole} style={{ color: palette.accountMeta }}>
              {profile.city || country}
            </AppText>
            <AppText role={metaRole} style={{ color: palette.accountMeta }}>
              ·
            </AppText>
            <AppText
              testID="creator-handle"
              role={metaRole}
              style={{ color: palette.accountMeta }}
              numberOfLines={1}
            >
              @{profile.slug}
            </AppText>
          </View>
        </View>
        <ScrollView
          horizontal
          testID="creator-actions"
          style={{ width: '100%', minWidth: 0, flexGrow: 0 }}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingRight: designTokens.space.x3,
          }}
        >
          <FigmaButton
            label="Подписаться"
            variant="solid"
            onPress={onSubscribe}
          />
          <CreatorSocialActions profile={profile} />
        </ScrollView>
      </View>
    </View>
  );
}
