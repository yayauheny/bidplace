import { View } from 'react-native';
import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';

import { CreatorSocialLink } from './CreatorSocialLink';
import { listPublicSocialLinks } from './creator-social-links';

export function CreatorSocialActions({
  profile,
}: {
  profile: PortfolioWorkDetailResponse['author'];
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      {listPublicSocialLinks(profile).map((link) => (
        <CreatorSocialLink
          key={link.key}
          testID={`creator-social-${link.key}`}
          grouped
          href={link.href}
          icon={link.icon}
          label={link.label}
        />
      ))}
    </View>
  );
}
