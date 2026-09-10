import { Text, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { ResilientRemoteImage } from '../ui/ResilientRemoteImage';
import { FigmaChip } from './FigmaChip';
import { getAuthorCoverContent, type AuthorCoverInput } from './author-cover-fields';
import {
  authorIdentityAvatarStyle,
  authorIdentityContentStyle,
  authorIdentityRowStyle,
  authorIdentitySpec,
  authorIdentityTagRowStyle,
} from './author-identity-style';

export function AuthorIdentity({
  fullName,
  slug,
  tags,
  imageUrl,
}: AuthorCoverInput & { imageUrl: string }) {
  const content = getAuthorCoverContent({ fullName, slug, tags });
  const spec = authorIdentitySpec();

  return (
    <View testID="figma-author-identity" style={authorIdentityRowStyle()}>
      <ResilientRemoteImage
        uri={getApiAssetUrl(imageUrl)}
        component="AuthorIdentity"
        accessibilityLabel={`Фото автора ${fullName}`}
        fallbackLabel={`Фото автора недоступно: ${fullName}`}
        style={authorIdentityAvatarStyle()}
        contentFit="cover"
      />
      <View style={authorIdentityContentStyle()}>
        <Text
          numberOfLines={1}
          style={[{ color: figmaTokens.color.ink }, spec.handle]}
        >
          {content.handle}
        </Text>
        {content.tags.length > 0 ? (
          <View style={authorIdentityTagRowStyle()}>
            {content.tags.map((tag) => (
              <FigmaChip key={tag} label={tag} tone="onLight" />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
