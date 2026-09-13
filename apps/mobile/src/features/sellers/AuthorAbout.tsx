import { ScrollView, View } from 'react-native';

import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import { AppText, ResilientRemoteImage } from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';

export function AuthorAbout({
  author,
}: {
  author: PortfolioWorkDetailResponse['author'];
}) {
  return (
    <View style={{ gap: designTokens.space.authorAboutGap }}>
      <AboutSection title="Биография" body={author.shortDescription} />
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
            contentContainerStyle={{ gap: designTokens.space.sectionGap }}
          >
            {author.achievements.map((item) => (
              <View
                key={item.id}
                style={{
                  width: designTokens.size.achievementWidth,
                  gap: designTokens.space.x7,
                }}
              >
                {item.occurredAt ? (
                  <View style={{ position: 'relative' }}>
                    <View
                      aria-hidden
                      style={{
                        position: 'absolute',
                        top: 34,
                        left: 0,
                        right: -designTokens.space.sectionGap,
                        height: 1,
                        backgroundColor: designTokens.color.divider,
                      }}
                    />
                    <View
                      aria-hidden
                      style={{
                        position: 'absolute',
                        top: 24,
                        left: '50%',
                        height: 20,
                        width: 1,
                        backgroundColor: designTokens.color.divider,
                      }}
                    />
                    <AppText
                      role="achievementDate"
                      style={{ textAlign: 'center' }}
                    >
                      {new Intl.DateTimeFormat('ru-RU', {
                        month: '2-digit',
                        year: 'numeric',
                        timeZone: 'UTC',
                      }).format(new Date(item.occurredAt))}
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
                  ) : null}
                  <AppText role="bodySmall">{item.body}</AppText>
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
