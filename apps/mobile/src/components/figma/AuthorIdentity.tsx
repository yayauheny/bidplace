import { Text, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { ResilientRemoteImage } from '../ui/ResilientRemoteImage';
import { FigmaChip } from './FigmaChip';
import { getAuthorCoverContent, type AuthorCoverInput } from './author-cover-fields';

export function AuthorIdentity({
  fullName,
  slug,
  tags,
  imageUrl,
}: AuthorCoverInput & { imageUrl: string }) {
  const content = getAuthorCoverContent({ fullName, slug, tags });

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <ResilientRemoteImage
        uri={getApiAssetUrl(imageUrl)}
        component="AuthorIdentity"
        accessibilityLabel={`Фото автора ${fullName}`}
        fallbackLabel={`Фото автора недоступно: ${fullName}`}
        style={{
          width: figmaTokens.size.avatar,
          height: figmaTokens.size.avatar,
          borderRadius: figmaTokens.radius.avatar,
        }}
        contentFit="cover"
      />
      <View
        style={{
          padding: figmaTokens.space.coverPad,
          gap: figmaTokens.space.identityGap,
        }}
      >
        <Text
          style={[
            { color: figmaTokens.color.ink },
            figmaTokens.typography.identityHandle,
          ]}
        >
          {content.handle}
        </Text>
        {content.tags.length > 0 ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: figmaTokens.space.chipGap,
            }}
          >
            {content.tags.map((tag) => (
              <FigmaChip key={tag} label={tag} tone="onLight" />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
