import { Platform, TextInput, View, type TextInput as TextInputRef } from 'react-native';
import { useRef } from 'react';

import { figmaTokens } from '@bidplace/design-tokens';

import { FigmaIcon } from '../../components/figma/FigmaIcon';
import { MotionPressable } from '../../components/ui/MotionPressable';
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
        <SearchOverlayField value={query} onChangeText={onChangeQuery} />
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="Закрыть поиск"
          onPress={onClose}
          preset="icon"
          style={searchOverlayCloseStyle()}
        >
          <FigmaIcon name="x" size={figmaTokens.size.dockIcon} />
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

  return (
    <View style={searchOverlayFieldChromeStyle()}>
      <View style={searchOverlayIconFrameStyle()}>
        <FigmaIcon name="search-01" size={figmaTokens.size.dockIcon} />
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel="Поиск"
        placeholder="Поиск"
        placeholderTextColor={figmaTokens.color.muted}
        autoCorrect={false}
        returnKeyType="search"
        testID="search-overlay-query"
        onSubmitEditing={() => inputRef.current?.blur()}
        style={{
          ...searchOverlayFieldInputStyle(),
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
