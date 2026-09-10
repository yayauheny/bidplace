import { Text, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { ResilientRemoteImage } from '../ui/ResilientRemoteImage';
import { getCreatorHeroContent } from './creator-hero';

export function CompactCreatorHeader({
  imageUrl,
  fullName,
  slug,
}: {
  imageUrl: string;
  fullName: string;
  slug: string;
}) {
  const content = getCreatorHeroContent({
    fullName,
    slug,
    city: '',
    tags: [],
  });

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: figmaTokens.space.x2,
        minHeight: figmaTokens.size.header,
      }}
    >
      <ResilientRemoteImage
        uri={getApiAssetUrl(imageUrl)}
        component="CompactCreatorHeader"
        accessibilityLabel={`Фото автора ${fullName}`}
        fallbackLabel={`Фото автора недоступно: ${fullName}`}
        contentFit="cover"
        style={{
          width: figmaTokens.size.header,
          height: figmaTokens.size.header,
          borderRadius: figmaTokens.radius.avatar,
        }}
      />
      <Text
        style={[
          { color: figmaTokens.color.ink },
          figmaTokens.typography.screenTitle,
        ]}
      >
        {content.handle}
      </Text>
    </View>
  );
}
