import { Text, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { ResilientRemoteImage } from '../ui/ResilientRemoteImage';
import { FigmaChip } from './FigmaChip';
import { coverChipRowStyle } from './cover-card-style';
import { getAuthorCoverContent, type AuthorCoverInput } from './author-cover-fields';

export function AuthorIdentity({
  fullName,
  slug,
  tags,
  imageUrl,
}: AuthorCoverInput & { imageUrl: string }) {
  const content = getAuthorCoverContent({ fullName, slug, tags });
  const identityWidth =
    figmaTokens.size.identityAvatar + figmaTokens.size.coverWidth;

  return (
    <View
      style={{
        width: identityWidth,
        height: figmaTokens.size.identityAvatar,
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
          width: figmaTokens.size.identityAvatar,
          height: figmaTokens.size.identityAvatar,
          borderRadius: figmaTokens.radius.avatar,
        }}
        contentFit="cover"
      />
      <View
        style={{
          width: figmaTokens.size.coverWidth,
          height: figmaTokens.size.identityAvatar,
          padding: figmaTokens.space.coverPad,
          gap: figmaTokens.space.identityGap,
          overflow: 'hidden',
        }}
      >
        <Text
          numberOfLines={1}
          style={[
            { color: figmaTokens.color.ink },
            figmaTokens.typography.identityRowHandle,
          ]}
        >
          {content.handle}
        </Text>
        {content.tags.length > 0 ? (
          <View style={coverChipRowStyle()}>
            {content.tags.map((tag) => (
              <View key={tag} style={{ flexShrink: 0 }}>
                <FigmaChip label={tag} tone="onLight" />
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
