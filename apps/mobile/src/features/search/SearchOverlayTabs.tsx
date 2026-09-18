import { View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { FigmaChoiceChip } from '../../components/figma/FigmaChoiceChip';

import {
  searchOverlayTabs,
  type SearchOverlayTab,
} from './search-overlay-tabs';

/** Figma `456:8247` — 6px between the three Search tabs. */
const SEARCH_OVERLAY_TAB_GAP = 6;

export function SearchOverlayTabs({
  tab,
  onChangeTab,
}: {
  tab: SearchOverlayTab;
  onChangeTab: (tab: SearchOverlayTab) => void;
}) {
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel="Разделы поиска"
      style={{
        width: '100%',
        marginTop: figmaTokens.space.x2,
        flexDirection: 'row',
        gap: SEARCH_OVERLAY_TAB_GAP,
      }}
    >
      {searchOverlayTabs.map((item) => (
        <View key={item.value} style={{ flex: 1, minWidth: 0 }}>
          <FigmaChoiceChip
            label={item.label}
            selected={tab === item.value}
            stretch
            accessibilityRole="tab"
            onPress={() => onChangeTab(item.value)}
          />
        </View>
      ))}
    </View>
  );
}
