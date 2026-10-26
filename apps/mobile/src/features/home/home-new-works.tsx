import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { FigmaButton, WorkCoverCard } from '../../components/figma';
import { AppText } from '../../components/ui';
import { type HomeWorkItem } from './home-sections';

export function HomeNewWorks({ works }: { works: HomeWorkItem[] }) {
  const { push } = useRouter();

  return (
    <View
      nativeID="home-new-works"
      style={{
        gap: designTokens.space.sectionGap,
        minWidth: 0,
        alignSelf: 'stretch',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: designTokens.layout.gutter,
        }}
      >
        <AppText role="sectionTitle" accessibilityRole="header">
          Новые работы
        </AppText>
        <FigmaButton
          label="Смотреть все"
          variant="muted"
          onPress={() => push('/explore?section=works')}
        />
      </View>
      <View
        style={{
          marginHorizontal: -designTokens.layout.gutter,
          minWidth: 0,
          alignSelf: 'stretch',
          overflow: 'hidden',
        }}
      >
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          style={{ width: '100%', maxWidth: '100%' }}
          contentContainerStyle={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: designTokens.layout.gutter,
            paddingHorizontal: designTokens.layout.gutter,
          }}
        >
          {works.map((item) => {
            const image = item.work.images[0];
            return (
              <View
                key={item.work.publicId}
                style={{
                  width: designTokens.size.coverWidth,
                  flexShrink: 0,
                }}
              >
                <WorkCoverCard
                  href={`/product/${item.work.publicId}`}
                  imageUrl={image?.url ?? ''}
                  imagePresentation={image}
                  imageLabel={item.work.title}
                  title={item.work.title}
                  authorSlug={item.author.slug}
                />
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}
