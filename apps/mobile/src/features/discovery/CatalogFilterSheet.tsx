import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import {
  FigmaButton,
  FilterOptionRow,
  FilterSearchField,
  FilterSheet,
  FilterSheetSectionRow,
} from '../../components/figma';
import { AppText } from '../../components/ui';

export type CatalogFilterSection = {
  id: string;
  label: string;
  value?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  state: 'ready' | 'loading' | 'error' | 'empty';
  onRetry?: () => void;
};

export function CatalogFilterSheet({
  open,
  title = 'Фильтры',
  search,
  sections,
  onApply,
  onClose,
}: {
  open: boolean;
  title?: string;
  search?: { id: string; value?: string; placeholder?: string };
  sections: ReadonlyArray<CatalogFilterSection>;
  onApply: (values: Record<string, string | undefined>) => void;
  onClose: () => void;
}) {
  const committedKey = JSON.stringify(
    [
      ...(search ? [[search.id, search.value]] : []),
      ...sections.map((section) => [section.id, section.value]),
    ],
  );
  const committedValues = useMemo(
    () =>
      Object.fromEntries(
        JSON.parse(committedKey) as Array<[string, string | undefined]>,
      ),
    [committedKey],
  );
  const [draftValues, setDraftValues] =
    useState<Record<string, string | undefined>>(committedValues);
  const [activeSectionId, setActiveSectionId] = useState<string>();
  const [optionSearch, setOptionSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    setDraftValues(committedValues);
    setActiveSectionId(undefined);
    setOptionSearch('');
  }, [committedValues, open]);

  const activeSection = sections.find(
    (section) => section.id === activeSectionId,
  );
  const apply = () =>
    onApply(
      Object.fromEntries(
        Object.entries(draftValues).map(([id, value]) => {
          const section = sections.find((item) => item.id === id);
          return [
            id,
            section?.state === 'ready' &&
            value &&
            !section.options.some((option) => option.value === value)
              ? undefined
              : value,
          ];
        }),
      ),
    );

  if (activeSection) {
    return (
      <FilterSheet
        open={open}
        compact
        onClose={onClose}
        title={activeSection.label}
        showBack
        onBack={() => setActiveSectionId(undefined)}
        onClear={() =>
          setDraftValues((current) => ({ ...current, [activeSection.id]: undefined }))
        }
        clearLabel="Очистить"
        primaryAction={{ label: 'Применить', onPress: apply }}
      >
        <SectionOptions
          section={activeSection}
          value={draftValues[activeSection.id]}
          query={optionSearch}
          onChangeQuery={setOptionSearch}
          onSelect={(value) =>
            setDraftValues((current) => ({
              ...current,
              [activeSection.id]:
                current[activeSection.id] === value ? undefined : value,
            }))
          }
        />
      </FilterSheet>
    );
  }

  return (
    <FilterSheet
      open={open}
      compact
      onClose={onClose}
      title={title}
      onClear={() =>
        setDraftValues(
          Object.fromEntries([
            ...(search ? [[search.id, undefined]] : []),
            ...sections.map((section) => [section.id, undefined]),
          ]),
        )
      }
      clearLabel="Сбросить"
      primaryAction={{
        label: 'Применить',
        onPress: apply,
      }}
    >
      {search ? (
        <View
          style={{
            marginBottom: figmaTokens.space.x4,
          }}
        >
          <FilterSearchField
            value={draftValues[search.id] ?? ''}
            placeholder={search.placeholder}
            onChangeText={(value) =>
              setDraftValues((current) => ({
                ...current,
                [search.id]: value,
              }))
            }
          />
        </View>
      ) : null}
      {sections.map((section) => (
        <FilterSheetSectionRow
          key={section.id}
          label={section.label}
          valuePreview={sectionPreview(section, draftValues[section.id])}
          disabled={section.state !== 'ready'}
          compact
          onPress={() => {
            setOptionSearch('');
            setActiveSectionId(section.id);
          }}
        />
      ))}
    </FilterSheet>
  );
}

function SectionOptions({
  section,
  value,
  onSelect,
  query,
  onChangeQuery,
}: {
  section: CatalogFilterSection;
  value?: string;
  onSelect: (value: string) => void;
  query: string;
  onChangeQuery: (value: string) => void;
}) {
  if (section.state !== 'ready') {
    return (
      <View style={{ gap: figmaTokens.space.x4 }}>
        <AppText role="body" tone="secondary">
          {sectionStateLabel(section.state)}
        </AppText>
        {section.state === 'error' && section.onRetry ? (
          <FigmaButton
            label="Повторить"
            variant="outline"
            onPress={section.onRetry}
          />
        ) : null}
      </View>
    );
  }
  const needle = query.trim().toLocaleLowerCase();
  const visibleOptions = needle
    ? section.options.filter((option) =>
        option.label.toLocaleLowerCase().includes(needle),
      )
    : section.options;
  return (
    <>
      {section.options.length > 9 ? (
        <View style={{ marginBottom: figmaTokens.space.x2 }}>
          <FilterSearchField
            value={query}
            placeholder="Поиск по значениям"
            onChangeText={onChangeQuery}
          />
        </View>
      ) : null}
      {visibleOptions.length === 0 ? (
        <AppText role="body" tone="secondary">
          Ничего не найдено
        </AppText>
      ) : (
        visibleOptions.map((option) => (
          <FilterOptionRow
            key={option.value}
            label={option.label}
            mode="radio"
            variant="catalog"
            selected={option.value === value}
            onPress={() => onSelect(option.value)}
          />
        ))
      )}
    </>
  );
}

function sectionPreview(section: CatalogFilterSection, value?: string) {
  if (section.state !== 'ready') return sectionStateLabel(section.state);
  return (
    section.options.find((option) => option.value === value)?.label ??
    'Не выбрано'
  );
}

function sectionStateLabel(state: CatalogFilterSection['state']) {
  if (state === 'loading') return 'Загрузка…';
  if (state === 'error') return 'Не удалось загрузить';
  if (state === 'empty') return 'Нет доступных значений';
  return 'Не выбрано';
}
