import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { PortfolioWorkDetailResponse } from '../../lib/portfolio-types';
import { designTokens } from '@bidplace/design-tokens';
import { FigmaGlassSurface } from '../../components/figma/FigmaGlassSurface';
import { CreatorSocialLink } from './CreatorSocialLink';
import {
  CREATOR_COMPACT_SOCIAL_LIMIT,
  CREATOR_SOCIAL_OVERFLOW_TEST_ID,
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
          {links.map((link, index) => {
            const overflow = index >= CREATOR_COMPACT_SOCIAL_LIMIT;
            return (
              <View
                key={link.key}
                testID={
                  overflow
                    ? CREATOR_SOCIAL_OVERFLOW_TEST_ID
                    : `creator-social-${link.key}`
                }
                aria-hidden={compact && overflow}
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
            );
          })}
        </FigmaGlassSurface>
      ) : null}
      {actions}
    </View>
  );
}
