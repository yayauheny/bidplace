import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';
import { FigmaGlassSurface } from '../../components/figma/FigmaGlassSurface';
import { CreatorSocialLink } from './CreatorSocialLink';
import {
  CREATOR_COMPACT_SOCIAL_LIMIT,
  listPublicSocialLinks,
} from './creator-header-motion';

export function CreatorSocialActions({
  profile,
  actions,
  compact = false,
}: {
  profile: PortfolioWorkDetailResponse['author'];
  actions: ReactNode;
  compact?: boolean;
}) {
  const links = listPublicSocialLinks(profile);
  const visible = compact
    ? links.slice(0, CREATOR_COMPACT_SOCIAL_LIMIT)
    : links;

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: designTokens.space.socialGroupGap,
      }}
    >
      {visible.length > 0 ? (
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
          {visible.map((link) => (
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
