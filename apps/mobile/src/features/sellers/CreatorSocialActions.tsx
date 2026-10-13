import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';
import { FigmaGlassSurface } from '../../components/figma/FigmaGlassSurface';
import { CreatorSocialLink } from './CreatorSocialLink';
import { listPublicSocialLinks } from './creator-social-links';

export function CreatorSocialActions({
  profile,
  actions,
}: {
  profile: PortfolioWorkDetailResponse['author'];
  actions: ReactNode;
}) {
  const links = listPublicSocialLinks(profile);

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: designTokens.space.socialGroupGap,
      }}
    >
      {links.length > 0 ? (
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
          {links.map((link) => (
            <View
              key={link.key}
              testID={`creator-social-${link.key}`}
              style={{
                width: designTokens.size.control,
                height: designTokens.size.control,
              }}
            >
              <CreatorSocialLink
                grouped
                href={link.href}
                icon={link.icon}
                label={link.label}
              />
            </View>
          ))}
        </FigmaGlassSurface>
      ) : null}
      <View key="creator-share-action">{actions}</View>
    </View>
  );
}
