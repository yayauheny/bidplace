import { Link } from 'expo-router';
import { Heart, Pencil, Trash2 } from 'lucide-react-native';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

import { WorkCoverCard } from '../../components/figma/WorkCoverCard';
import { MotionPressable } from '../../components/ui';

type Item = {
  work: {
    id: string;
    publicId: string;
    title: string;
    images: Array<{ url: string }>;
  };
  author: { slug: string };
};

const actionStyle = {
  width: 40,
  height: 40,
  borderRadius: designTokens.radius.pill,
  backgroundColor: designTokens.color.white,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

export function CreatorWorkCard({
  item,
  isOwner,
  onUnavailable,
  onHide,
}: {
  item: Item;
  isOwner: boolean;
  onUnavailable: (feature: string) => void;
  onHide: (id: string) => void;
}) {
  const image = item.work.images[0];

  return (
    <View style={{ position: 'relative' }}>
      <WorkCoverCard
        href={`/product/${item.work.publicId}`}
        imageUrl={image?.url ?? ''}
        imageLabel={item.work.title}
        title={item.work.title}
        authorSlug={item.author.slug}
      />
      <View
        testID={`author-work-actions-${item.work.publicId}`}
        style={{
          position: 'absolute',
          right: designTokens.space.x3,
          top: designTokens.space.x3,
          flexDirection: 'row',
          gap: designTokens.space.x2,
          zIndex: 2,
        }}
      >
        {isOwner ? (
          <>
            <Link href={`/products/${item.work.id}`} asChild>
              <MotionPressable
                accessibilityRole="link"
                accessibilityLabel={`Редактировать работу ${item.work.title}`}
                preset="icon"
                style={actionStyle}
              >
                <Pencil size={21} color={designTokens.color.ink} />
              </MotionPressable>
            </Link>
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel={`Скрыть работу ${item.work.title}`}
              onPress={() => onHide(item.work.id)}
              preset="icon"
              style={[actionStyle, { backgroundColor: designTokens.color.danger }]}
            >
              <Trash2 size={21} color={designTokens.color.white} />
            </MotionPressable>
          </>
        ) : null}
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel={`Нравится работа ${item.work.title}`}
          onPress={() => onUnavailable('Избранные работы')}
          preset="icon"
          style={actionStyle}
        >
          <Heart size={22} color={designTokens.color.ink} />
        </MotionPressable>
      </View>
    </View>
  );
}
