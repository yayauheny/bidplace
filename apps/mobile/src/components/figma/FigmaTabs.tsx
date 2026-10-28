import { useEffect } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { sheetTimingConfig } from '../../lib/layout-transition';
import { useReducedMotion } from '../../lib/reduced-motion';
import { useCssBorderBox } from './use-css-border-box';
import { designTokens, searchChromeTokens } from '@bidplace/design-tokens';
import { useAppTheme } from '../../providers/theme-provider';
import { AppText, MotionPressable } from '../ui';
import type { FigmaTabsProps } from './figma-tabs';
import { FigmaSearchGlass } from './FigmaSearchGlass';

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
  variant = 'underline',
  appearance = 'glass',
}: FigmaTabsProps) {
  const palette = useAppTheme();
  const segmented = variant === 'segmented';
  // Plain segmented control, Figma 7345:722. Glass consumers retain their rail.
  const plain = segmented && appearance === 'plain';
  const tabHeight = plain ? 36 : searchChromeTokens.tab.height;
  const railPadding = plain ? 2 : searchChromeTokens.rail.padding;
  const railGap = plain ? 0 : searchChromeTokens.rail.gap;
  const { layout, onLayout } = useCssBorderBox();
  const reduced = useReducedMotion();
  const index = Math.max(
    0,
    tabs.findIndex((tab) => tab.value === value),
  );
  const position = useSharedValue(index);
  useEffect(() => {
    if (!segmented) return;
    position.value = withTiming(index, {
      ...sheetTimingConfig,
      duration: reduced ? 0 : designTokens.motion.control,
    });
  }, [index, position, reduced, segmented]);
  const width = Math.max(
    0,
    (layout.width - 2 * railPadding - (tabs.length - 1) * railGap) /
      tabs.length,
  );
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value * (width + railGap) }],
  }));
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

  const content = (
    <ScrollView
      horizontal
      onLayout={segmented ? onLayout : undefined}
      accessibilityRole={selection ? 'toolbar' : 'tablist'}
      accessibilityLabel={label}
      contentContainerStyle={{
        gap: segmented ? railGap : designTokens.space.x2,
        flexGrow: 1,
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        paddingHorizontal: segmented ? railPadding : contentInset,
        paddingVertical: segmented ? railPadding : 0,
      }}
    >
      {segmented && width > 0 ? (
        <Animated.View
          testID="segmented-tab-indicator"
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: railPadding,
              top: railPadding,
              width,
              height: tabHeight,
              borderRadius: searchChromeTokens.tab.radius,
              backgroundColor: palette.mutedFill,
            },
            indicatorStyle,
          ]}
        />
      ) : null}
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
          style={
            segmented
              ? {
                  flex: 1,
                  minWidth: 0,
                  height: tabHeight,
                  borderRadius: searchChromeTokens.tab.radius,
                  borderWidth: plain ? 0 : searchChromeTokens.strokeWidth,
                  borderColor: palette.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'transparent',
                }
              : {
                  paddingBottom: designTokens.space.x1,
                  borderBottomWidth: 2,
                  borderBottomColor:
                    value === tab.value ? palette.ink : 'transparent',
                }
          }
        >
          <AppText
            role={
              plain
                ? value === tab.value
                  ? 'segmentSelected'
                  : 'segmentLabel'
                : segmented
                  ? 'body'
                  : 'profileTab'
            }
            style={
              segmented && !plain
                ? searchChromeTokens.tab.typography
                : undefined
            }
            tone={
              (!plain && segmented) || value === tab.value
                ? 'default'
                : 'subdued'
            }
          >
            {tab.label}
            {tab.count !== undefined ? (
              <>
                {' '}
                <AppText
                  role="profileTabCount"
                  tone={
                    segmented || value === tab.value ? 'default' : 'subdued'
                  }
                >
                  {tab.count}
                </AppText>
              </>
            ) : null}
          </AppText>
        </MotionPressable>
      ))}
    </ScrollView>
  );
  return segmented && plain ? (
    <View
      testID="plain-segmented-tabs"
      style={{
        height: 42,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 22,
        overflow: 'hidden',
      }}
    >
      {content}
    </View>
  ) : segmented ? (
    <FigmaSearchGlass
      testID="segmented-tabs"
      kind="rail"
      style={{ width: '100%' }}
    >
      {content}
    </FigmaSearchGlass>
  ) : (
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
      {content}
    </View>
  );
}
