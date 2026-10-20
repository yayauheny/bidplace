import {
  Platform,
  TextInput,
  View,
  type TextInput as TextInputRef,
} from 'react-native';
import { useRef } from 'react';

import { designTokens } from '@bidplace/design-tokens';

import { FigmaIcon } from '../../components/figma/FigmaIcon';
import { FigmaSearchGlass } from '../../components/figma/FigmaSearchGlass';
import { MotionPressable } from '../../components/ui/MotionPressable';
import { useAppTheme } from '../../providers/theme-provider';
import { SearchOverlayTabs } from './SearchOverlayTabs';
import {
  searchOverlayCloseStyle,
  searchOverlayFieldChromeStyle,
  searchOverlayFieldInputStyle,
  searchOverlayFieldRowStyle,
  searchOverlayIconFrameStyle,
} from './search-overlay-header-style';
import { type SearchOverlayTab } from './search-overlay-tabs';

export function SearchOverlayHeader({
  query,
  onChangeQuery,
  tab,
  onChangeTab,
  onClose,
}: {
  query: string;
  onChangeQuery: (value: string) => void;
  tab: SearchOverlayTab;
  onChangeTab: (tab: SearchOverlayTab) => void;
  onClose: () => void;
}) {
  return (
    <>
      <View style={searchOverlayFieldRowStyle()}>
        <FigmaSearchGlass
          kind="field"
          style={{ flex: 1, minWidth: 0 }}
          testID="search-overlay-field"
        >
          <SearchOverlayField value={query} onChangeText={onChangeQuery} />
        </FigmaSearchGlass>
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="Закрыть поиск"
          onPress={onClose}
          preset="icon"
          style={searchOverlayCloseStyle()}
        >
          <FigmaSearchGlass
            kind="close"
            testID="search-overlay-close"
            style={searchOverlayCloseStyle()}
          >
            <FigmaIcon name="x" size={designTokens.size.dockIcon} />
          </FigmaSearchGlass>
        </MotionPressable>
      </View>
      <SearchOverlayTabs tab={tab} onChangeTab={onChangeTab} />
    </>
  );
}

function SearchOverlayField({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (value: string) => void;
}) {
  const inputRef = useRef<TextInputRef>(null);
  const palette = useAppTheme();

  return (
    <View style={searchOverlayFieldChromeStyle()}>
      <View style={searchOverlayIconFrameStyle()}>
        <FigmaIcon name="search-01" size={designTokens.size.dockIcon} />
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel="Поиск"
        placeholder="Поиск"
        placeholderTextColor={palette.muted}
        autoCorrect={false}
        returnKeyType="search"
        testID="search-overlay-query"
        onSubmitEditing={() => inputRef.current?.blur()}
        style={{
          ...searchOverlayFieldInputStyle(palette),
          ...(Platform.OS === 'web'
            ? ({
                outlineStyle: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
              } as object)
            : null),
        }}
      />
    </View>
  );
}
