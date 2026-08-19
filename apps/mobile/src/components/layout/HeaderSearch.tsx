import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TextInput, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppIcon } from '../ui';
import { submitHeaderSearch } from './header-chrome';
import {
  headerSearchContainerStyle,
  headerSearchInputStyle,
} from './header-layout';

type HeaderSearchProps = {
  inline: boolean;
  placeholder: string;
};

export function HeaderSearch({ inline, placeholder }: HeaderSearchProps) {
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState('');

  useEffect(() => {
    setQuery(typeof q === 'string' ? q : '');
  }, [q]);

  return (
    <View style={headerSearchContainerStyle({ inline })}>
      <AppIcon name="search" size={18} color={designTokens.color.textSecondary} />
      <TextInput
        accessibilityLabel="Найти предмет или автора"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => submitHeaderSearch(router, query)}
        returnKeyType="search"
        placeholder={placeholder}
        placeholderTextColor={designTokens.color.textMuted}
        style={headerSearchInputStyle()}
      />
    </View>
  );
}

