import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';

import type { Category } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import { FilterOptionRow } from '../../components/figma/FilterOptionRow';
import { FilterSearchField } from '../../components/figma/FilterSearchField';
import { FilterSheet } from '../../components/figma/FilterSheet';
import { FigmaChoiceChip } from '../../components/figma/FigmaChoiceChip';
import { AppText, SecondaryButton } from '../../components/ui';
import { categoryKeys } from '../../lib/query-cache';
import { useApiClient } from '../../providers/api-provider';

export function AuthorDirectionsPickerSheet({
  open,
  selectedIds,
  knownDirections,
  disabled = false,
  onClose,
  onApply,
  returnFocusRef,
}: {
  open: boolean;
  selectedIds: readonly string[];
  knownDirections: readonly Category[];
  disabled?: boolean;
  onClose: () => void;
  onApply: (ids: string[]) => void;
  returnFocusRef?: { current: { focus?: () => void } | null };
}) {
  const api = useApiClient();
  const [search, setSearch] = useState('');
  const [draftIds, setDraftIds] = useState<string[]>([...selectedIds]);
  const categories = useQuery({
    queryKey: categoryKeys.all,
    queryFn: ({ signal }) => api.categories.list({ signal }),
    enabled: open,
  });

  const activeCategories = categories.data?.categories ?? [];
  const categoriesReady =
    categories.isSuccess ||
    (categories.isError && categories.data !== undefined);

  const hiddenInDraft = useMemo(() => {
    const knownById = new Map(
      knownDirections.map((direction) => [direction.id, direction]),
    );
    if (!categoriesReady) {
      return draftIds
        .map((id) => knownById.get(id))
        .filter(
          (direction): direction is Category =>
            direction !== undefined && direction.active === false,
        );
    }
    const selectableIds = new Set(
      activeCategories.map((category) => category.id),
    );
    return draftIds
      .filter((id) => !selectableIds.has(id))
      .map((id) => knownById.get(id))
      .filter((direction): direction is Category => direction !== undefined);
  }, [activeCategories, categoriesReady, draftIds, knownDirections]);

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = activeCategories.filter((category) =>
    normalizedSearch
      ? category.name.toLowerCase().includes(normalizedSearch)
      : true,
  );

  const toggle = (id: string) => {
    if (disabled) return;
    setDraftIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  };

  const removeHidden = (id: string) => {
    if (disabled) return;
    setDraftIds((current) => current.filter((value) => value !== id));
  };

  const clearSelections = () => {
    if (disabled) return;
    setDraftIds([]);
  };

  useEffect(() => {
    if (!open) return;
    setDraftIds([...selectedIds]);
    setSearch('');
  }, [open, selectedIds]);

  const listDisabled = disabled || categories.isPending;

  return (
    <FilterSheet
      open={open}
      onClose={onClose}
      title="Направление работ"
      titleVariant="directions"
      showBack
      onClear={clearSelections}
      returnFocusRef={returnFocusRef}
      primaryAction={{
        label: 'Применить',
        size: 'pickerAction',
        disabled: disabled,
        onPress: () => {
          onApply(draftIds);
          onClose();
        },
      }}
    >
      <View
        style={{
          marginBottom: designTokens.authorApplication.directionsListGap,
          transform: [
            {
              translateX: designTokens.authorApplication.directionsContentInset,
            },
          ],
        }}
      >
        <FilterSearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск"
          variant="authorApplication"
        />
      </View>
      {hiddenInDraft.length > 0 ? (
        <View
          style={{
            marginBottom: designTokens.space.x3,
            gap: designTokens.space.x2,
          }}
        >
          <AppText role="bodySmall" tone="secondary">
            Ранее выбранные направления, которые больше недоступны для нового
            выбора:
          </AppText>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: designTokens.space.authorChipGap,
            }}
          >
            {hiddenInDraft.map((direction) => (
              <FigmaChoiceChip
                key={direction.id}
                label={direction.name}
                selected
                removable
                disabled={disabled}
                onPress={() => removeHidden(direction.id)}
                onRemove={() => removeHidden(direction.id)}
              />
            ))}
          </View>
        </View>
      ) : null}
      {categories.isPending && activeCategories.length === 0 ? (
        <AppText role="body" tone="secondary">
          Загружаем направления…
        </AppText>
      ) : categories.isError && activeCategories.length === 0 ? (
        <View style={{ gap: designTokens.space.x4 }}>
          <AppText role="body" tone="danger">
            Не удалось загрузить направления
          </AppText>
          <SecondaryButton
            label="Повторить"
            width="content"
            onPress={() => void categories.refetch()}
          />
        </View>
      ) : filtered.length === 0 ? (
        <AppText role="body" tone="secondary">
          Ничего не найдено
        </AppText>
      ) : (
        <View
          style={{
            marginHorizontal:
              designTokens.authorApplication.directionsContentInset,
          }}
        >
          {filtered.map((category) => (
            <FilterOptionRow
              key={category.id}
              label={category.name}
              mode="checkbox"
              variant="directions"
              selected={draftIds.includes(category.id)}
              disabled={listDisabled}
              onPress={() => toggle(category.id)}
            />
          ))}
        </View>
      )}
    </FilterSheet>
  );
}
