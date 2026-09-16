import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';
import { WorkGallery } from '../../components/figma/WorkGallery';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { WorkBackControl, WorkShareControl } from './WorkActions';
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
        leadingAction={<WorkBackControl onPress={onBack} />}
        action={<WorkShareControl onPress={onShare} />}
      />
      <View
        style={{
          paddingHorizontal: designTokens.space.pageGutter,
          paddingTop: designTokens.space.sectionGap,
          gap: designTokens.space.x10,
        }}
      >
        <WorkIdentity
          title={title}
          authorName={authorName}
          authorHref={authorHref}
          chips={chips}
        />
        <FigmaTabs
          tabs={tabs}
          value={tab}
          onChange={onTabChange}
          label="Информация о работе"
          panelId={panelId}
        />
      </View>
    </>
  );
}
