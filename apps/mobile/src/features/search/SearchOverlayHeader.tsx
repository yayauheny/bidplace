import { Platform, TextInput, View, type TextInput as TextInputRef } from 'react-native';
import { useRef } from 'react';

import { figmaTokens } from '@bidplace/design-tokens';

import { FigmaIcon } from '../../components/figma/FigmaIcon';
import { MotionPressable } from '../../components/ui/MotionPressable';
import { SearchOverlayTabs } from './SearchOverlayTabs';
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
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          gap: figmaTokens.space.x3,
        }}
      >
        <SearchOverlayField value={query} onChangeText={onChangeQuery} />
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="Закрыть поиск"
          onPress={onClose}
          preset="icon"
          style={{
            width: figmaTokens.size.input,
            height: figmaTokens.size.input,
            borderRadius: figmaTokens.radius.dock,
            backgroundColor: figmaTokens.color.searchSurface,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
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
    <View
      style={{
        flex: 1,
        minWidth: 0,
        height: figmaTokens.size.input,
        flexDirection: 'row',
        alignItems: 'center',
        gap: figmaTokens.space.x2,
        paddingHorizontal: figmaTokens.space.x2,
        borderRadius: figmaTokens.radius.dock,
        backgroundColor: figmaTokens.color.searchSurface,
      }}
    >
      <View style={{ padding: figmaTokens.space.iconPad }}>
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
          flex: 1,
          minWidth: 0,
          padding: 0,
          color: figmaTokens.color.ink,
          ...figmaTokens.typography.field,
          ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
        }}
      />
    </View>
  );
}
