import { ScrollView } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import { AppText, MotionPressable } from '../ui';
import type { FigmaTabsProps } from './figma-tabs';
export function FigmaTabs({ tabs, value, onChange, label }: FigmaTabsProps) {
  return (
    <ScrollView
      horizontal
      accessibilityRole="tablist"
      accessibilityLabel={label}
      contentContainerStyle={{ gap: designTokens.space.x2 }}
    >
      {tabs.map((tab) => (
        <MotionPressable
          key={tab.value}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === tab.value }}
          onPress={() => onChange(tab.value)}
          style={{
            paddingBottom: designTokens.space.x1,
            borderBottomWidth: 2,
            borderBottomColor:
              value === tab.value ? designTokens.color.ink : 'transparent',
          }}
        >
          <AppText role="profileTab">
            {tab.label}
            {tab.count !== undefined ? ` ${tab.count}` : ''}
          </AppText>
        </MotionPressable>
      ))}
    </ScrollView>
  );
}
