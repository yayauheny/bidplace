import { Link } from 'expo-router';
import { View } from 'react-native';
import { designTokens, type SemanticColorMap } from '@bidplace/design-tokens';

import { WorkCoverCard } from '../../components/figma/WorkCoverCard';
import { FigmaIcon } from '../../components/figma/FigmaIcon';
import { MotionPressable } from '../../components/ui';
import { useAppTheme } from '../../providers/theme-provider';

type Item = {
  work: {
    id: string;
    publicId: string;
    title: string;
    images: Array<{
      url: string;
      crop?: import('@bidplace/contracts').PhotoCrop | null;
      width?: number | null;
      height?: number | null;
    }>;
  };
  author: { slug: string };
};

function actionStyle(palette: SemanticColorMap) {
  return {
    width: 40,
    height: 40,
    borderRadius: designTokens.radius.pill,
    backgroundColor: palette.white,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}

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
  const palette = useAppTheme();
  const image = item.work.images[0];

  return (
    <View style={{ position: 'relative' }}>
      <WorkCoverCard
        href={`/product/${item.work.publicId}`}
        imageUrl={image?.url ?? ''}
        imagePresentation={image}
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
                style={actionStyle(palette)}
              >
                <FigmaIcon name="pencil-edit-01" size={20} />
              </MotionPressable>
            </Link>
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel={`Скрыть работу ${item.work.title}`}
              onPress={() => onHide(item.work.id)}
              preset="icon"
              style={[
                actionStyle(palette),
                { backgroundColor: palette.danger },
              ]}
            >
              <FigmaIcon name="delete-02" size={20} color={palette.white} />
            </MotionPressable>
          </>
        ) : null}
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel={`Нравится работа ${item.work.title}`}
          onPress={() => onUnavailable('Избранные работы')}
          preset="icon"
          style={actionStyle(palette)}
        >
          <FigmaIcon
            name="heart"
            size={20}
            strokeWidthPx={designTokens.stroke.iconHeavy}
          />
        </MotionPressable>
      </View>
    </View>
  );
}
