import { View } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

import { AppText } from './AppText';
import { MotionPressable } from './MotionPressable';

export type ContentTab = { id: string; label: string };

export function ContentTabs({
  tabs,
  activeId,
  onChange,
}: {
  tabs: ContentTab[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: modernTokens.space.x2,
      }}
    >
      {tabs.map((tab) => {
        const selected = tab.id === activeId;
        return (
          <MotionPressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.id)}
            preset="button"
            style={{
              minHeight: modernTokens.size.touch,
              justifyContent: 'center',
              borderRadius: modernTokens.radius.pill,
              backgroundColor: selected
                ? modernTokens.color.ink
                : modernTokens.color.chip,
              paddingHorizontal: modernTokens.space.x3,
            }}
          >
            <AppText
              role="label"
              style={{
                color: selected
                  ? modernTokens.color.surface
                  : modernTokens.color.ink,
              }}
            >
              {tab.label}
            </AppText>
          </MotionPressable>
        );
      })}
    </View>
  );
}
