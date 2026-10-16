import { Platform, View } from 'react-native';
import { Rect, Svg } from 'react-native-svg';

import { searchChromeTokens } from '@bidplace/design-tokens';

import { AppText } from '../../components/ui/AppText';
import { MotionPressable } from '../../components/ui/MotionPressable';
import { FigmaSearchGlass } from '../../components/figma/FigmaSearchGlass';
import { useAppTheme } from '../../providers/theme-provider';
import { useCssBorderBox } from '../../components/figma/use-css-border-box';
import {
  searchOverlayTabPanelId,
  searchOverlayTabs,
  type SearchOverlayTab,
} from './search-overlay-tabs';

export function SearchOverlayTabs({
  tab,
  onChangeTab,
}: {
  tab: SearchOverlayTab;
  onChangeTab: (tab: SearchOverlayTab) => void;
}) {
  const { rail } = searchChromeTokens;

  return (
    <FigmaSearchGlass
      kind="rail"
      testID="search-overlay-tabs"
      style={{
        width: rail.sampleWidth,
        maxWidth: '100%',
        alignSelf: 'flex-start',
        marginTop: searchChromeTokens.railOffset,
      }}
    >
      <View
        accessibilityRole="tablist"
        accessibilityLabel="Разделы поиска"
        style={{
          height: rail.sampleHeight,
          flexDirection: 'row',
          alignItems: 'center',
          padding: rail.padding,
          gap: rail.gap,
        }}
      >
        {searchOverlayTabs.map((item) => (
          <SearchOverlayTabButton
            key={item.value}
            label={item.label}
            selected={tab === item.value}
            panelId={searchOverlayTabPanelId(item.value)}
            onPress={() => onChangeTab(item.value)}
          />
        ))}
      </View>
    </FigmaSearchGlass>
  );
}

function SearchOverlayTabButton({
  label,
  selected,
  panelId,
  onPress,
}: {
  label: string;
  selected: boolean;
  panelId: string;
  onPress: () => void;
}) {
  const { tab } = searchChromeTokens;
  const palette = useAppTheme();
  const { layout, onLayout } = useCssBorderBox();

  return (
    <MotionPressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      {...(Platform.OS === 'web'
        ? ({ 'aria-selected': selected, 'aria-controls': panelId } as object)
        : {})}
      onPress={onPress}
      opacityFeedback="component"
      onLayout={onLayout}
      style={{
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
        minWidth: 0,
        height: tab.height,
        borderRadius: tab.radius,
        backgroundColor: selected ? palette.mutedFill : palette.surface,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <SearchTabStroke width={layout.width} height={layout.height} />
      <AppText
        role="body"
        numberOfLines={1}
        style={{
          color: palette.tabInactive,
          fontFamily: tab.typography.fontFamily,
          fontSize: tab.typography.fontSize,
          lineHeight: tab.typography.lineHeight,
          letterSpacing: tab.typography.letterSpacing,
          fontWeight: tab.typography.fontWeight,
        }}
      >
        {label}
      </AppText>
    </MotionPressable>
  );
}

function SearchTabStroke({ width, height }: { width: number; height: number }) {
  const { tab, strokeWidth } = searchChromeTokens;
  const palette = useAppTheme();
  if (width <= 0 || height <= 0) return null;
  const inset = strokeWidth / 2;
  const innerWidth = width - strokeWidth;
  const innerHeight = height - strokeWidth;
  const radius = Math.min(tab.radius, innerWidth / 2, innerHeight / 2);

  return (
    <Svg
      pointerEvents="none"
      aria-hidden
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      <Rect
        x={inset}
        y={inset}
        width={innerWidth}
        height={innerHeight}
        rx={radius}
        ry={radius}
        fill="none"
        stroke={palette.surface}
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}
