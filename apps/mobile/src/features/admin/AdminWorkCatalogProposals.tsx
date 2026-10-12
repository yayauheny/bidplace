import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { View } from 'react-native';

import { normalizeCatalogName, type AdminProduct } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import { AppText, DestructiveButton, SecondaryButton, TextField } from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';

type Proposal = NonNullable<AdminProduct['reviewTarget']>['selection']['proposals'][number];

export function AdminWorkCatalogProposals({
  proposals,
  onChanged,
}: {
  proposals: readonly Proposal[];
  onChanged: () => void;
}) {
  const api = useApiClient();
  const pending = proposals.filter((proposal) => proposal.selected && proposal.status === 'PENDING');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');
  const active = pending.find((proposal) => proposal.id === activeId);
  const role = active?.kind === 'MATERIAL' || active?.kind === 'TECHNIQUE'
    ? active.kind
    : null;
  const terms = useQuery({
    queryKey: ['catalog', 'terms', role],
    queryFn: ({ signal }) => api.catalog.listTerms(role!, { signal }),
    enabled: role !== null,
  });
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: ({ signal }) => api.categories.list({ signal }),
    enabled: active?.kind === 'CATEGORY',
  });
  const resolve = useMutation({
    mutationFn: async (action:
      | { kind: 'map'; id: string }
      | { kind: 'create' }
      | { kind: 'reject'; reason: string }
    ) => {
      if (!active) throw new Error('Proposal is no longer available');
      if (action.kind === 'reject') {
        return api.admin.rejectCatalogProposal(active.id, action.reason);
      }
      if (action.kind === 'map') {
        return api.admin.mapCatalogProposal(active.id,
          active.kind === 'CATEGORY' ? { categoryId: action.id } : { termId: action.id },
        );
      }
      if (active.kind === 'CATEGORY') {
        const result = await api.admin.createCatalogCategory(active.rawName);
        return api.admin.mapCatalogProposal(active.id, { categoryId: result.category.id });
      }
      const result = await api.admin.createCatalogTerm({
        role: active.kind,
        name: active.rawName,
      });
      return api.admin.mapCatalogProposal(active.id, { termId: result.term.id });
    },
    onSuccess: () => {
      setActiveId(null);
      setSearch('');
      setReason('');
      onChanged();
    },
  });
  if (pending.length === 0) return null;
  const selectable = active?.kind === 'CATEGORY'
    ? (categories.data?.categories ?? []).filter((category) => category.slug !== 'other')
    : (terms.data?.terms ?? []);
  const normalized = normalizeCatalogName(search);
  const options = selectable.filter((option) =>
    !normalized || normalizeCatalogName(option.name).includes(normalized),
  ).slice(0, 12);
  const loading = active?.kind === 'CATEGORY' ? categories.isPending : terms.isPending;
  const failed = active?.kind === 'CATEGORY' ? categories.isError : terms.isError;

  return (
    <View style={{ gap: designTokens.space.x2 }}>
      <AppText role="label">Предложения автора — требуется решение модератора</AppText>
      {pending.map((proposal) => (
        <SecondaryButton
          key={proposal.id}
          label={`${proposal.kind === 'CATEGORY' ? 'Категория' : proposal.kind === 'MATERIAL' ? 'Материал' : 'Техника'}: ${proposal.rawName}`}
          disabled={resolve.isPending}
          onPress={() => {
            setActiveId(proposal.id);
            setSearch(proposal.rawName);
            setReason('');
            resolve.reset();
          }}
        />
      ))}
      {active ? (
        <View style={{ gap: designTokens.space.x2 }}>
          <AppText role="bodySmall" tone="secondary">
            Сопоставьте «{active.rawName}» с существующим значением
            или создайте новый справочный термин.
          </AppText>
          <TextField
            label="Поиск в справочнике"
            value={search}
            onChangeText={setSearch}
          />
          {loading ? <AppText role="bodySmall" tone="secondary">Загружаем справочник…</AppText> : null}
          {failed ? <AppText role="bodySmall" tone="danger">Справочник недоступен. Повторите попытку.</AppText> : null}
          {!loading && !failed ? (
            <>
              {options.map((option) => (
                <SecondaryButton
                  key={option.id}
                  label={`Сопоставить: ${option.name}`}
                  disabled={resolve.isPending}
                  onPress={() => resolve.mutate({ kind: 'map', id: option.id })}
                />
              ))}
              <SecondaryButton
                label={`Создать «${active.rawName}» и сопоставить`}
                disabled={resolve.isPending}
                onPress={() => resolve.mutate({ kind: 'create' })}
              />
            </>
          ) : null}
          <TextField
            label="Причина отклонения предложения"
            value={reason}
            onChangeText={setReason}
          />
          <DestructiveButton
            label="Отклонить предложение"
            disabled={resolve.isPending || !reason.trim()}
            onPress={() => resolve.mutate({ kind: 'reject', reason: reason.trim() })}
          />
          <SecondaryButton
            label="Закрыть обработку"
            disabled={resolve.isPending}
            onPress={() => setActiveId(null)}
          />
          {resolve.isError ? (
            <AppText role="bodySmall" tone="danger">
              Не удалось обработать предложение. Обновите список и проверьте, не было ли оно уже обработано.
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
