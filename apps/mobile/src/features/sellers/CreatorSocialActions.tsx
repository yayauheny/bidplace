import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';
import { FigmaGlassSurface } from '../../components/figma/FigmaGlassSurface';
import { CreatorSocialLink } from './CreatorSocialLink';
export function CreatorSocialActions({
  profile,
  actions,
}: {
  profile: PortfolioWorkDetailResponse['author'];
  actions: ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: designTokens.space.socialGroupGap,
      }}
    >
      {profile.telegramUrl || profile.instagramUrl || profile.websiteUrl ? (
        <FigmaGlassSurface
          preset="controlGroup"
          testID="author-social-group"
          contentStyle={{
            display: 'flex',
            flexDirection: 'row',
            gap: designTokens.space.socialGroupGap,
            paddingLeft: designTokens.space.socialGroupX,
            paddingRight: designTokens.space.socialGroupX,
            paddingTop: designTokens.space.socialGroupY,
            paddingBottom: designTokens.space.socialGroupY,
          }}
        >
          {profile.telegramUrl ? (
            <CreatorSocialLink
              grouped
              href={profile.telegramUrl}
              icon="send"
              label="Telegram автора"
            />
          ) : null}
          {profile.instagramUrl ? (
            <CreatorSocialLink
              grouped
              href={profile.instagramUrl}
              icon="instagram"
              label="Instagram автора"
            />
          ) : null}
          {profile.websiteUrl ? (
            <CreatorSocialLink
              grouped
              href={profile.websiteUrl}
              icon="globe"
              label="Сайт автора"
            />
          ) : null}
        </FigmaGlassSurface>
      ) : null}
      {actions}
    </View>
  );
}
