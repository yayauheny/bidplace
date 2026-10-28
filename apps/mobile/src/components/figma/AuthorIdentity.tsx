import { Text, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { useAppTheme } from '../../providers/theme-provider';
import { ResilientRemoteImage } from '../ui/ResilientRemoteImage';
import { FigmaChip } from './FigmaChip';
import { coverChipRowStyle } from './cover-card-style';
import {
  getAuthorCoverContent,
  type AuthorCoverInput,
} from './author-cover-fields';

export function AuthorIdentity({
  fullName,
  slug,
  tags,
  imageUrl,
}: AuthorCoverInput & { imageUrl: string }) {
  const content = getAuthorCoverContent({ fullName, slug, tags });
  const palette = useAppTheme();
  const identityWidth =
    designTokens.size.identityAvatar + designTokens.size.coverWidth;

  return (
    <View
      style={{
        width: identityWidth,
        height: designTokens.size.identityAvatar,
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
          width: designTokens.size.identityAvatar,
          height: designTokens.size.identityAvatar,
          borderRadius: designTokens.radius.avatar,
        }}
        contentFit="cover"
      />
      <View
        style={{
          width: designTokens.size.coverWidth,
          height: designTokens.size.identityAvatar,
          padding: designTokens.space.coverPad,
          gap: designTokens.space.identityGap,
          overflow: 'hidden',
        }}
      >
        <Text
          numberOfLines={1}
          style={[
            { color: palette.ink },
            designTokens.typography.identityRowHandle,
          ]}
        >
          {content.handle}
        </Text>
        {content.tags.length > 0 ? (
          <View style={coverChipRowStyle()}>
            {content.tags.map((tag) => (
              <View key={tag} style={{ flexShrink: 0 }}>
                <FigmaChip label={tag} tone="tinted" />
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
