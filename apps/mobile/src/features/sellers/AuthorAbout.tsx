import { useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';

import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import {
  PaddedGrid,
  gridColumnsFromWidth,
} from '../../components/figma/PaddedGrid';
import { AppText, ResilientRemoteImage } from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';
import { useAppTheme } from '../../providers/theme-provider';
import { formatAuthorAchievementLabel } from './achievement-date';
import { authorAchievementRailSpec } from './author-achievement-rail';

export function AuthorAbout({
  author,
}: {
  author: PortfolioWorkDetailResponse['author'];
}) {
  const [width, setWidth] = useState(0);
  const columns = gridColumnsFromWidth(width, {
    minCardWidth: 440,
    gap: 40,
    max: 2,
  });
  const sections = [
    { title: 'Биография', body: author.biography ?? author.shortDescription },
    ...(author.practice
      ? [{ title: 'Практика и подход', body: author.practice }]
      : []),
  ];
  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ gap: designTokens.space.authorAboutGap }}
    >
      <PaddedGrid
        items={sections}
        columns={columns}
        gap={40}
        keyExtractor={(item) => item.title}
        renderItem={(item) => <AboutSection {...item} wide={columns === 2} />}
      />
      {author.publicEmail ? (
        <View style={{ gap: designTokens.space.x2 }}>
          <AppText role="profileHeading" accessibilityRole="header">
            Контакты
          </AppText>
          <Pressable
            onPress={() => void Linking.openURL(`mailto:${author.publicEmail}`)}
          >
            <AppText role="bodySmall">{author.publicEmail}</AppText>
          </Pressable>
        </View>
      ) : null}
      {author.achievements.length > 0 ? (
        <View style={{ gap: designTokens.space.sectionGap }}>
          <AppText role="profileHeading" accessibilityRole="header">
            Выставки и достижения
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: designTokens.space.x4 }}
          >
            {author.achievements.map((item) => (
              <AchievementCard key={item.id} item={item} />
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function AchievementCard({
  item,
}: {
  item: PortfolioWorkDetailResponse['author']['achievements'][number];
}) {
  const palette = useAppTheme();
  const rail = authorAchievementRailSpec(palette);

  return (
    <View
      testID="author-achievement-card"
      style={{
        width: designTokens.size.achievementWidth,
        gap: designTokens.space.x3,
      }}
    >
      {item.occurredDate ? (
        <View style={{ gap: designTokens.space.x1 }}>
          <View
            aria-hidden
            testID="author-achievement-rail"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: rail.row,
            }}
          >
            <View
              style={{
                width: rail.marker,
                height: rail.marker,
                padding: rail.markerPad,
                borderRadius: rail.markerRadius,
                backgroundColor: rail.markerFill,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: rail.markerHole,
                  height: rail.markerHole,
                  borderRadius: rail.markerRadius,
                  backgroundColor: rail.markerHoleFill,
                }}
              />
            </View>
            <View
              style={{
                flex: 1,
                height: rail.lineHeight,
                borderRadius: rail.lineRadius,
                backgroundColor: rail.lineColor,
              }}
            />
          </View>
          <AppText role="achievementDate">
            {formatAuthorAchievementLabel(item.occurredDate)}
          </AppText>
        </View>
      ) : null}
      <View style={{ gap: designTokens.space.x3 }}>
        {item.image ? (
          <ResilientRemoteImage
            uri={getApiAssetUrl(item.image.url)}
            component="AuthorAchievement"
            accessibilityLabel="Фото выставки или достижения автора"
            fallbackLabel="Фотография недоступна"
            style={{
              width: '100%',
              aspectRatio: rail.imageAspect,
              borderRadius: rail.imageRadius,
            }}
          />
        ) : (
          <View
            style={{
              width: '100%',
              minHeight: (designTokens.size.achievementWidth * 4) / 3,
              padding: designTokens.space.x3,
              borderRadius: rail.imageRadius,
              backgroundColor: palette.surfaceMuted,
              justifyContent: 'center',
            }}
          >
            <AppText
              role="achievementStatement"
              style={{ textAlign: 'center' }}
            >
              {item.body}
            </AppText>
          </View>
        )}
        {item.image ? <AppText role="bodySmall">{item.body}</AppText> : null}
      </View>
    </View>
  );
}

function AboutSection({
  title,
  body,
  wide,
}: {
  title: string;
  body: string;
  wide: boolean;
}) {
  return (
    <View style={{ gap: designTokens.space.x2 }}>
      <AppText
        role={wide ? 'aboutHeadingWide' : 'profileHeading'}
        tone="strong"
        accessibilityRole="header"
      >
        {title}
      </AppText>
      <AppText
        role={wide ? 'aboutBodyWide' : 'bodySmall'}
        tone={wide ? 'subdued' : 'strong'}
      >
        {body}
      </AppText>
    </View>
  );
}
