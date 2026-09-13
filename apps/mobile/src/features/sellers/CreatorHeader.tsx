import { View } from 'react-native';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { CreatorHero } from './CreatorHero';
import { AuthorShare } from './AuthorShare';
import type { CreatorHeaderProps } from './creator-header';
export function CreatorHeader({
  profile,
  tabs,
  tab,
  onTabChange,
  panelId,
}: CreatorHeaderProps) {
  return (
    <View>
      <CreatorHero
        profile={profile}
        actions={<AuthorShare sharePath={profile.sharePath} />}
      />
      <FigmaTabs
        tabs={tabs}
        value={tab}
        onChange={onTabChange}
        label="Профиль автора"
        panelId={panelId}
        align="center"
      />
    </View>
  );
}
