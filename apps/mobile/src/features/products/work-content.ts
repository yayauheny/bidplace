import type { PortfolioWorkDetailResponse, StoryBlock } from '@bidplace/contracts';

export type WorkTab = 'story' | 'details' | 'delivery';

export function workTabs(blocks: readonly StoryBlock[], sale: boolean) {
  return [
    ...(blocks.length > 0 ? [{ value: 'story', label: 'История' }] : []),
    { value: 'details', label: 'Детали' },
    ...(sale
      ? [{ value: 'delivery', label: 'Как проходит сделка' }]
      : []),
  ];
}

export function resolveWorkTab(
  blocks: readonly StoryBlock[],
  requested: string | undefined,
  sale: boolean,
): WorkTab {
  if (requested === 'delivery') {
    if (!sale) return blocks.length > 0 ? 'story' : 'details';
    return 'delivery';
  }
  if (requested === 'details') return 'details';
  return blocks.length > 0 ? 'story' : 'details';
}

export function workFacts(work: PortfolioWorkDetailResponse['work']) {
  return [
    { label: 'Размеры', value: work.dimensions },
    { label: 'Материал', value: work.materials },
    { label: 'Техника', value: work.technique },
    { label: 'Тираж', value: work.uniqueness },
    {
      label: 'Год создания',
      value: work.year === null ? null : String(work.year),
    },
  ].filter(
    (item): item is { label: string; value: string } =>
      item.value !== null && item.value.trim() !== '',
  );
}
