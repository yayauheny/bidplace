import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AuthorCoverCard } from '../../components/figma';
import { AppText, PrimaryButton } from '../../components/ui';
import {
  homeAuthorFanLayout,
  homeAuthorFanSlots,
  type HomeAuthorFanSlot,
} from './home-author-fan';
import { type HomeAuthor } from './home-sections';

function authorTags(author: HomeAuthor) {
  return author.discipline
    ? author.discipline.split(',').map((tag) => tag.trim()).filter(Boolean)
    : [];
}

function fanPositionStyle(slot: HomeAuthorFanSlot) {
  if (slot === 'front') {
    return {
      position: 'absolute' as const,
      left: homeAuthorFanLayout.frontPos.x,
      top: homeAuthorFanLayout.frontPos.y,
      zIndex: 2,
    };
  }
  const place =
    slot === 'rearLeft'
      ? homeAuthorFanLayout.rearLeft
      : homeAuthorFanLayout.rearRight;
  return {
    position: 'absolute' as const,
    left: place.x,
    top: place.y,
    zIndex: 1,
    opacity: homeAuthorFanLayout.rearOpacity,
    transform: [{ rotate: place.rotate }],
    transformOrigin: homeAuthorFanLayout.rearTransformOrigin,
  };
}

function fanShadowShellStyle(slot: HomeAuthorFanSlot) {
  const size =
    slot === 'front' ? homeAuthorFanLayout.front : homeAuthorFanLayout.rear;
  return {
    width: size.width,
    height: size.height,
    borderRadius: homeAuthorFanLayout.cardRadius,
    overflow: 'visible' as const,
    ...(slot === 'front'
      ? { boxShadow: homeAuthorFanLayout.frontShadow }
      : null),
  };
}

export function HomeNewAuthors({ authors }: { authors: HomeAuthor[] }) {
  const { push } = useRouter();
  const slots = homeAuthorFanSlots(authors);
  if (slots.length === 0) return null;

  return (
    <View
      nativeID="home-new-authors"
      style={{
        width: homeAuthorFanLayout.sectionWidth,
        alignSelf: 'center',
        gap: designTokens.space.sectionGap,
      }}
    >
      <AppText
        role="sectionTitle"
        accessibilityRole="header"
        style={{ textAlign: 'center', width: homeAuthorFanLayout.sectionWidth }}
      >
        Новые авторы
      </AppText>
      <View
        style={{
          width: homeAuthorFanLayout.sectionWidth,
          height: homeAuthorFanLayout.fanHeight,
        }}
      >
        {slots.map((item) => {
          const size =
            item.slot === 'front'
              ? homeAuthorFanLayout.front
              : homeAuthorFanLayout.rear;
          return (
            <View key={item.author.slug} style={fanPositionStyle(item.slot)}>
              <View style={fanShadowShellStyle(item.slot)}>
                <AuthorCoverCard
                  fullName={item.author.fullName}
                  slug={item.author.slug}
                  tags={authorTags(item.author)}
                  imageUrl={item.author.profilePhotoUrl}
                  size={size}
                  frameRadius={homeAuthorFanLayout.cardRadius}
                  interaction="static"
                />
              </View>
            </View>
          );
        })}
      </View>
      <PrimaryButton
        label="Смотреть все"
        width="full"
        onPress={() => push('/authors')}
      />
    </View>
  );
}
