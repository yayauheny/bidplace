import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { MotionPressable } from '../ui/MotionPressable';
import { ResilientRemoteImage } from '../ui/ResilientRemoteImage';
import { FigmaChip } from './FigmaChip';
import { CoverFrost } from './CoverFrost';
import {
  authorCoverNameVeilStyle,
  authorCoverTagRowStyle,
  coverCardFocusStyle,
  coverCardFrameStyle,
  coverCardMediaStyle,
  coverCardOverlayLayerStyle,
  coverCardPressableStyle,
  coverCardSpec,
  coverCardSurfaceStyle,
} from './cover-card-style';
import {
  authorCoverAccessibilityLabel,
  getAuthorCoverContent,
  type AuthorCoverInput,
} from './author-cover-fields';

export function AuthorCoverCard({
  fullName,
  slug,
  tags,
  imageUrl,
}: AuthorCoverInput & { imageUrl: string }) {
  const content = getAuthorCoverContent({ fullName, slug, tags });
  const spec = coverCardSpec();

  return (
    <View testID="figma-author-cover-card" style={coverCardFrameStyle('author')}>
      <Link href={`/seller/${slug}`} asChild>
        <MotionPressable
          accessibilityRole="link"
          accessibilityLabel={authorCoverAccessibilityLabel(content)}
          preset="card"
          style={(state) => [
            coverCardPressableStyle('author'),
            coverCardSurfaceStyle('author'),
            coverCardFocusStyle(state.focused),
          ]}
        >
          <ResilientRemoteImage
            uri={getApiAssetUrl(imageUrl)}
            component="AuthorCoverCard"
            accessibilityLabel={`Фото автора ${fullName}`}
            fallbackLabel={`Фото автора недоступно: ${fullName}`}
            style={coverCardMediaStyle}
            contentFit={spec.contentFit}
          />
          <View style={coverCardOverlayLayerStyle('author')}>
            <LinearGradient
              colors={[figmaTokens.color.overlayScrim, 'rgba(0, 0, 0, 0)']}
              style={authorCoverNameVeilStyle()}
            >
              <Text
                numberOfLines={spec.nameMaxLines}
                style={[
                  {
                    color: figmaTokens.color.white,
                    textAlign: 'center',
                  },
                  figmaTokens.typography.authorName,
                ]}
              >
                {content.fullName}
              </Text>
            </LinearGradient>
            <CoverFrost imageUrl={imageUrl}>
              <Text
                numberOfLines={1}
                style={[
                  { color: figmaTokens.color.white },
                  figmaTokens.typography.authorHandle,
                ]}
              >
                {content.handle}
              </Text>
              {content.tags.length > 0 ? (
                <View style={authorCoverTagRowStyle()}>
                  {content.tags.map((tag) => (
                    <FigmaChip key={tag} label={tag} tone="onDark" />
                  ))}
                </View>
              ) : null}
            </CoverFrost>
          </View>
        </MotionPressable>
      </Link>
    </View>
  );
}
