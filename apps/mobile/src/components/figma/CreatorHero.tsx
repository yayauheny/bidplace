import { Text, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { ResilientRemoteImage } from '../ui/ResilientRemoteImage';
import { AuthorAtmosphere } from './AuthorAtmosphere';
import { FigmaChip } from './FigmaChip';
import { CREATOR_HERO_GAP, getCreatorHeroContent } from './creator-hero';

export function CreatorHero({
  imageUrl,
  fullName,
  slug,
  city,
  tags,
}: {
  imageUrl: string;
  fullName: string;
  slug: string;
  city: string;
  tags: readonly string[];
}) {
  const content = getCreatorHeroContent({ fullName, slug, city, tags });

  return (
    <View style={{ position: 'relative', overflow: 'visible' }}>
      <AuthorAtmosphere imageUrl={imageUrl} fullName={fullName} />
      <View
        style={{
          alignItems: 'center',
          gap: CREATOR_HERO_GAP,
          paddingHorizontal: figmaTokens.space.pageGutter,
          paddingTop: figmaTokens.space.x10,
          zIndex: 1,
        }}
      >
        <ResilientRemoteImage
          uri={getApiAssetUrl(imageUrl)}
          component="CreatorHero"
          accessibilityLabel={`Фото автора ${fullName}`}
          fallbackLabel={`Фото автора недоступно: ${fullName}`}
          contentFit="cover"
          style={{
            width: figmaTokens.size.avatar,
            height: figmaTokens.size.avatar,
            borderRadius: figmaTokens.radius.avatar,
          }}
        />
        <View style={{ alignItems: 'center', gap: figmaTokens.space.x2 }}>
          <Text
            style={[
              { color: figmaTokens.color.ink },
              figmaTokens.typography.identityHandle,
            ]}
          >
            {content.handle}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: figmaTokens.space.x2,
            }}
          >
            <Text
              style={[
                { color: figmaTokens.color.ink },
                figmaTokens.typography.label,
              ]}
            >
              {content.fullName}
            </Text>
            {content.city ? (
              <>
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: figmaTokens.color.ink,
                  }}
                />
                <Text
                  style={[
                    { color: figmaTokens.color.ink },
                    figmaTokens.typography.label,
                  ]}
                >
                  {content.city}
                </Text>
              </>
            ) : null}
          </View>
        </View>
        {content.tags.length > 0 ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: figmaTokens.space.chipGap,
            }}
          >
            {content.tags.map((tag) => (
              <FigmaChip key={tag} label={tag} tone="onGlass" />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
