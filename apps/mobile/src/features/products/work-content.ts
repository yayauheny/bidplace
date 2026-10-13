import type { PortfolioWorkDetailResponse, StoryBlock } from '@bidplace/contracts';

export type WorkTab = 'story' | 'details' | 'delivery';

export function workTabs(blocks: readonly StoryBlock[]) {
  return [
    ...(blocks.length > 0 ? [{ value: 'story', label: 'История' }] : []),
    { value: 'details', label: 'Детали' },
    { value: 'delivery', label: 'Оплата и доставка' },
  ];
}

export function resolveWorkTab(
  blocks: readonly StoryBlock[],
  requested?: string,
): WorkTab {
  if (requested === 'delivery' || requested === 'details') return requested;
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
