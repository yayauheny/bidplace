import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { FilterOptionRow } from '../../components/figma/FilterOptionRow';
import { FilterSearchField } from '../../components/figma/FilterSearchField';
import { FilterSheet } from '../../components/figma/FilterSheet';
import { AppText, SecondaryButton } from '../../components/ui';
import { catalogKeys } from '../../lib/query-cache';
import { useApiClient } from '../../providers/api-provider';

export function CountryPickerSheet({
  open,
  selectedCode,
  onClose,
  onSelect,
}: {
  open: boolean;
  selectedCode: string;
  onClose: () => void;
  onSelect: (code: string) => void;
}) {
  const api = useApiClient();
  const [search, setSearch] = useState('');
  const query = search.trim();
  const countries = useQuery({
    queryKey: catalogKeys.countries(query),
    queryFn: ({ signal }) => api.countries.list(query, { signal }),
    enabled: open,
  });

  return (
    <FilterSheet open={open} onClose={onClose} title="Страна">
      <View style={{ marginBottom: designTokens.space.x4 }}>
        <FilterSearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск"
        />
      </View>
      {countries.isPending ? (
        <AppText role="body" tone="secondary">
          Загружаем страны…
        </AppText>
      ) : countries.isError ? (
        <View style={{ gap: designTokens.space.x4 }}>
          <AppText role="body" tone="danger">
            Не удалось загрузить страны
          </AppText>
          <SecondaryButton
            label="Повторить"
            width="content"
            onPress={() => void countries.refetch()}
          />
        </View>
      ) : countries.data.countries.length === 0 ? (
        <AppText role="body" tone="secondary">
          Ничего не найдено
        </AppText>
      ) : (
        countries.data.countries.map((country) => (
          <FilterOptionRow
            key={country.code}
            label={country.name}
            mode="radio"
            selected={country.code === selectedCode}
            onPress={() => onSelect(country.code)}
          />
        ))
      )}
    </FilterSheet>
  );
}
