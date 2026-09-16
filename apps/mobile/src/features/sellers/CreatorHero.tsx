import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';
import { AuthorAtmosphere } from '../../components/figma/AuthorAtmosphere';
import { FigmaChip } from '../../components/figma/FigmaChip';
import { BrandLogo } from '../../components/layout/BrandLogo';
import { CreatorIdentity } from './CreatorIdentity';

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
  const tags = [
    ...new Set(
      profile.discipline
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ];
  const tagRow =
    tags.length > 0 ? (
      <View
        testID="creator-tags"
        style={{
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
    ) : null;

  return (
    <View
      testID="author-header"
      style={{
        overflow: 'visible',
        position: 'relative',
        paddingBottom: compact ? 0 : designTokens.space.authorHeaderBottom,
        height: compact ? '100%' : undefined,
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
          paddingTop: designTokens.space.logoTop,
          zIndex: 1,
          height: compact ? '100%' : undefined,
        }}
      >
        <View
          testID="creator-logo"
          style={{
            marginBottom:
              designTokens.space.logoGap - designTokens.space.authorSectionGap,
          }}
        >
          <BrandLogo profile />
        </View>
        <CreatorIdentity
          profile={profile}
          compact={compact}
          actions={actions}
          tags={tagRow}
        />
      </View>
    </View>
  );
}
