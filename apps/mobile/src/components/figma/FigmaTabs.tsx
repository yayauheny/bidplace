import { Platform, ScrollView, View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import { useAppTheme } from '../../providers/theme-provider';
import { AppText, MotionPressable } from '../ui';
import type { FigmaTabsProps } from './figma-tabs';

/**
 * Единые табы Figma. Паттерны:
 * - fill — таб-бар с фоном canvas и разделителем (липкая шапка на вебе);
 *   по умолчанию табы прозрачные.
 * Клавиатурная навигация (стрелки/Home/End + roving tabindex) включается
 * на вебе через web-спред — тот же идиом, что в FilterOptionRow.
 */
export function FigmaTabs({
  tabs,
  value,
  onChange,
  label,
  panelId,
  align = 'start',
  contentInset = 0,
  fill = false,
  selection = false,
}: FigmaTabsProps) {
  const palette = useAppTheme();
  const select = (index: number) => {
    onChange(tabs[index].value);
    if (Platform.OS === 'web') {
      document.getElementById(`${panelId}-${tabs[index].value}`)?.focus();
    }
  };
  const handleKeyDown = (
    event: { key: string; preventDefault: () => void },
    index: number,
  ) => {
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % tabs.length
        : event.key === 'ArrowLeft'
          ? (index + tabs.length - 1) % tabs.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? tabs.length - 1
              : undefined;
    if (next === undefined) return;
    event.preventDefault();
    select(next);
  };

  return (
    <View
      style={
        fill
          ? {
              backgroundColor: palette.canvas,
              borderBottomWidth: 1,
              borderBottomColor: palette.divider,
            }
          : null
      }
    >
      <ScrollView
        horizontal
        accessibilityRole={selection ? 'toolbar' : 'tablist'}
        accessibilityLabel={label}
        contentContainerStyle={{
          gap: designTokens.space.x2,
          flexGrow: 1,
          justifyContent: align === 'center' ? 'center' : 'flex-start',
          paddingHorizontal: contentInset,
        }}
      >
        {tabs.map((tab, index) => (
          <MotionPressable
            key={tab.value}
            accessibilityRole={selection ? 'button' : 'tab'}
            accessibilityState={
              selection && Platform.OS === 'web'
                ? undefined
                : { selected: value === tab.value }
            }
            nativeID={`${panelId}-${tab.value}`}
            onPress={() => onChange(tab.value)}
            {...(Platform.OS === 'web'
              ? ({
                  ...(selection
                    ? { 'aria-pressed': value === tab.value }
                    : {
                        'aria-controls': panelId,
                        'aria-selected': value === tab.value,
                      }),
                  tabIndex: value === tab.value ? 0 : -1,
                  onKeyDown: (event: {
                    key: string;
                    preventDefault: () => void;
                  }) => handleKeyDown(event, index),
                } as object)
              : {})}
            style={{
              paddingBottom: designTokens.space.x1,
              borderBottomWidth: 2,
              borderBottomColor:
                value === tab.value ? palette.ink : 'transparent',
            }}
          >
            <AppText
              role="profileTab"
              tone={value === tab.value ? 'default' : 'subdued'}
            >
              {tab.label}
              {tab.count !== undefined ? (
                <>
                  {' '}
                  <AppText
                    role="profileTabCount"
                    tone={value === tab.value ? 'default' : 'subdued'}
                  >
                    {tab.count}
                  </AppText>
                </>
              ) : null}
            </AppText>
          </MotionPressable>
        ))}
      </ScrollView>
    </View>
  );
}
