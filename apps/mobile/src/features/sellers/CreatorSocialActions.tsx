import { View } from 'react-native';
import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import { CreatorSocialLink } from './CreatorSocialLink';
import { listPublicSocialLinks } from './creator-social-links';

export function CreatorSocialActions({
  profile,
}: {
  profile: PortfolioWorkDetailResponse['author'];
}) {
  const links = listPublicSocialLinks(profile);

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: designTokens.space.x1 }}>
      {links.map((link) => (
        <View
          key={link.key}
          testID={`creator-social-${link.key}`}
          style={{
            width: designTokens.size.control,
            height: designTokens.size.control,
            borderRadius: designTokens.radius.pill,
            borderWidth: 1,
            borderColor: designTokens.color.divider,
            alignItems: 'center',
            justifyContent: 'center',
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
    </View>
  );
}
