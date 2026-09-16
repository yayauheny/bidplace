import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';
import { WorkGallery } from '../../components/figma/WorkGallery';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import { FigmaGlassSurface } from '../../components/figma/FigmaGlassSurface';
import type { WorkHeaderProps } from './work-header';
import { WorkIdentity } from './WorkIdentity';

export function WorkHeader({
  images,
  title,
  authorName,
  authorHref,
  chips,
  tabs,
  tab,
  onTabChange,
  panelId,
  onBack,
  onShare,
}: WorkHeaderProps) {
  return (
    <>
      <WorkGallery
        images={images}
        label={title}
        leadingAction={
          <FigmaGlassSurface
            preset="controlGroup"
            contentStyle={{ padding: designTokens.space.socialGroupY }}
          >
            <FigmaIconButton
              icon="arrow-left-01"
              iconSize={designTokens.size.socialGroupIcon}
              label="Назад"
              onPress={onBack}
            />
          </FigmaGlassSurface>
        }
        action={
          <FigmaGlassSurface
            preset="controlGroup"
            contentStyle={{ padding: designTokens.space.socialGroupY }}
          >
            <FigmaIconButton
              icon="share-04"
              iconSize={designTokens.size.socialGroupIcon}
              label="Поделиться работой"
              onPress={onShare}
            />
          </FigmaGlassSurface>
        }
      />
      <View
        style={{
          paddingHorizontal: designTokens.space.pageGutter,
          gap: designTokens.space.x10,
        }}
      >
        <WorkIdentity
          title={title}
          authorName={authorName}
          authorHref={authorHref}
          chips={chips}
        />
      </View>
      <div
        data-testid="work-sticky-tabs"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          background: designTokens.color.canvas,
        }}
      >
        <FigmaTabs
          tabs={tabs}
          value={tab}
          onChange={onTabChange}
          label="Информация о работе"
          panelId={panelId}
        />
      </div>
    </>
  );
}
