import { useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  normalizeCatalogName,
  type SellerProductDetailResponse,
} from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import { FilterOptionRow } from '../../components/figma/FilterOptionRow';
import { FilterSearchField } from '../../components/figma/FilterSearchField';
import { FilterSheet } from '../../components/figma/FilterSheet';
import { FigmaChoiceChip } from '../../components/figma/FigmaChoiceChip';
import { AppText, SecondaryButton } from '../../components/ui';

type CatalogTerm = SellerProductDetailResponse['selection']['materialTerms'][number];

export function ProductCatalogTermSheet({
  role,
  open,
  selectedIds,
  proposals,
  availableTerms,
  knownTerms,
  loading,
  error,
  editable,
  onRetry,
  onClose,
  onApply,
}: {
  role: 'MATERIAL' | 'TECHNIQUE';
  open: boolean;
  selectedIds: readonly string[];
  proposals: readonly string[];
  availableTerms: readonly CatalogTerm[];
  knownTerms: readonly CatalogTerm[];
  loading: boolean;
  error: boolean;
  editable: boolean;
  onRetry: () => void;
  onClose: () => void;
  onApply: (ids: string[], newNames: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const [draftProposals, setDraftProposals] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setDraftIds([...selectedIds]);
    setDraftProposals([...proposals]);
    setSearch('');
  }, [open, selectedIds, proposals]);

  const known = new Map([...knownTerms, ...availableTerms].map((term) => [term.id, term]));
  const selectable = new Set(availableTerms.map((term) => term.id));
  const hiddenSelected = draftIds
    .filter((id) => !selectable.has(id))
    .map((id) => known.get(id))
    .filter((term): term is CatalogTerm => term !== undefined);
  const normalized = normalizeCatalogName(search);
  const filtered = availableTerms.filter((term) =>
    normalized ? normalizeCatalogName(term.name).includes(normalized) : true,
  );
  const canPropose =
    editable &&
    search.trim().length > 0 &&
    search.trim().length <= 160 &&
    !availableTerms.some((term) => normalizeCatalogName(term.name) === normalized) &&
    !draftProposals.some((name) => normalizeCatalogName(name) === normalized) &&
    draftProposals.length < 20;
  const toggle = (id: string) => {
    setDraftIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  };

  return (
    <FilterSheet
      open={open}
      onClose={onClose}
      title={role === 'MATERIAL' ? 'Материалы' : 'Техники'}
      onClear={() => {
        setDraftIds([]);
        setDraftProposals([]);
      }}
      primaryAction={{
        label: 'Применить',
        disabled: !editable || loading || error,
        onPress: () => {
          onApply(draftIds, draftProposals);
          onClose();
        },
      }}
    >
      <View style={{ gap: designTokens.space.x3 }}>
        <FilterSearchField value={search} onChangeText={setSearch} placeholder="Поиск или новое значение" />
        {draftProposals.length > 0 ? (
          <>
            <AppText role="bodySmall" tone="secondary">На проверку модератору:</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: designTokens.space.x2 }}>
              {draftProposals.map((name) => (
                <FigmaChoiceChip
                  key={name}
                  label={name}
                  selected
                  removable
                  disabled={!editable}
                  onPress={() => setDraftProposals((current) => current.filter((item) => item !== name))}
                  onRemove={() => setDraftProposals((current) => current.filter((item) => item !== name))}
                />
              ))}
            </View>
          </>
        ) : null}
        {hiddenSelected.length > 0 ? (
          <>
            <AppText role="bodySmall" tone="secondary">Ранее выбранные, сейчас недоступны для нового выбора:</AppText>
            {hiddenSelected.map((term) => (
              <FilterOptionRow
                key={term.id}
                label={term.name}
                mode="checkbox"
                selected
                disabled={!editable}
                onPress={() => toggle(term.id)}
              />
            ))}
          </>
        ) : null}
        {loading ? (
          <AppText role="bodySmall" tone="secondary">Загружаем справочник…</AppText>
        ) : error ? (
          <>
            <AppText role="bodySmall" tone="danger">Не удалось загрузить справочник</AppText>
            <SecondaryButton label="Повторить" width="content" onPress={onRetry} />
          </>
        ) : (
          <>
            {filtered.map((term) => (
              <FilterOptionRow
                key={term.id}
                label={term.name}
                mode="checkbox"
                selected={draftIds.includes(term.id)}
                disabled={!editable || (!draftIds.includes(term.id) && draftIds.length >= 40)}
                onPress={() => toggle(term.id)}
              />
            ))}
            {canPropose ? (
              <SecondaryButton
                label={`Предложить «${search.trim()}»`}
                onPress={() => {
                  setDraftProposals((current) => [...current, search.trim()]);
                  setSearch('');
                }}
              />
            ) : null}
            {filtered.length === 0 && !canPropose ? (
              <AppText role="bodySmall" tone="secondary">Нет подходящих значений</AppText>
            ) : null}
          </>
        )}
      </View>
    </FilterSheet>
  );
}
