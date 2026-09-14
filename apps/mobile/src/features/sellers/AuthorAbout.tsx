import { ScrollView, View } from 'react-native';

import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import { AppText, ResilientRemoteImage } from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';
import { formatAchievementDate } from './achievement-date';

export function AuthorAbout({
  author,
}: {
  author: PortfolioWorkDetailResponse['author'];
}) {
  return (
    <View style={{ gap: designTokens.space.authorAboutGap }}>
      <AboutSection
        title="Биография"
        body={author.biography ?? author.shortDescription}
      />
      {author.practice ? (
        <AboutSection title="Практика и подход" body={author.practice} />
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
              <View
                key={item.id}
                testID="author-achievement-card"
                style={{
                  width: designTokens.size.achievementWidth,
                  gap: designTokens.space.x3,
                }}
              >
                {item.occurredAt ? (
                  <View style={{ gap: designTokens.space.x1 }}>
                    <View
                      aria-hidden
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <View
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          borderWidth: 2,
                          borderColor: '#565656',
                          backgroundColor: designTokens.color.surface,
                        }}
                      />
                      <View
                        style={{
                          flex: 1,
                          height: 2,
                          borderRadius: 6,
                          backgroundColor: '#565656',
                        }}
                      />
                    </View>
                    <AppText role="achievementDate">
                      {formatAchievementDate(item.occurredAt)}
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
                        aspectRatio: 3 / 4,
                        borderRadius: designTokens.radius.achievement,
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: '100%',
                        minHeight: (designTokens.size.achievementWidth * 4) / 3,
                        padding: designTokens.space.x3,
                        borderRadius: designTokens.radius.achievement,
                        backgroundColor: designTokens.color.surfaceMuted,
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
                  {item.image ? (
                    <AppText role="bodySmall">{item.body}</AppText>
                  ) : null}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function AboutSection({ title, body }: { title: string; body: string }) {
  return (
    <View style={{ gap: designTokens.space.x2 }}>
      <AppText role="profileHeading" accessibilityRole="header">
        {title}
      </AppText>
      <AppText role="bodySmall">{body}</AppText>
    </View>
  );
}
