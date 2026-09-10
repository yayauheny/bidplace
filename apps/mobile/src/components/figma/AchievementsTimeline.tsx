import { ScrollView, Text, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { ResilientRemoteImage } from '../ui/ResilientRemoteImage';
import {
  ACHIEVEMENT_CARD_WIDTH,
  ACHIEVEMENT_CAROUSEL_GAP,
  ACHIEVEMENT_IMAGE_HEIGHT,
  ACHIEVEMENTS_TITLE,
  achievementDateLabel,
  visibleAchievementRecords,
  type AchievementRecord,
} from './achievements-timeline';

export function AchievementsTimeline({
  records,
}: {
  records: readonly AchievementRecord[];
}) {
  const items = visibleAchievementRecords(records);
  if (items.length === 0) return null;

  return (
    <View style={{ gap: figmaTokens.space.x3, width: '100%' }}>
      <Text
        style={[
          { color: figmaTokens.color.ink },
          figmaTokens.typography.label,
        ]}
      >
        {ACHIEVEMENTS_TITLE}
      </Text>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: ACHIEVEMENT_CAROUSEL_GAP,
          paddingRight: figmaTokens.space.pageGutter,
        }}
      >
        {items.map((record) => (
          <AchievementCard key={record.id} record={record} />
        ))}
      </ScrollView>
    </View>
  );
}

function AchievementCard({ record }: { record: AchievementRecord }) {
  const dateLabel = achievementDateLabel(record.occurredAt);
  const imageUrl = record.imageUrl?.trim() ?? '';

  return (
    <View
      style={{
        width: ACHIEVEMENT_CARD_WIDTH,
        gap: figmaTokens.space.x7,
      }}
    >
      {dateLabel ? (
        <Text
          style={[
            { color: figmaTokens.color.ink },
            figmaTokens.typography.screenTitle,
          ]}
        >
          {dateLabel}
        </Text>
      ) : null}
      <View style={{ gap: figmaTokens.space.pageGutter }}>
        {imageUrl ? (
          <ResilientRemoteImage
            uri={getApiAssetUrl(imageUrl)}
            component="AchievementsTimeline"
            accessibilityLabel="Изображение достижения"
            fallbackLabel="Изображение достижения недоступно"
            contentFit="cover"
            style={{
              width: ACHIEVEMENT_CARD_WIDTH,
              height: ACHIEVEMENT_IMAGE_HEIGHT,
              borderRadius: figmaTokens.radius.overlay,
            }}
          />
        ) : null}
        <Text
          style={[
            { color: figmaTokens.color.ink },
            figmaTokens.typography.body,
          ]}
        >
          {record.body.trim()}
        </Text>
      </View>
    </View>
  );
}
