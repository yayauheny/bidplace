import type { PortfolioWorkDetailResponse } from '../../lib/portfolio-types';
export type WorkTab = 'story' | 'details' | 'delivery';
export function workTabs(story: string | null) {
  return [
    ...(story?.trim() ? [{ value: 'story', label: 'История' }] : []),
    { value: 'details', label: 'Детали' },
    { value: 'delivery', label: 'Оплата и доставка' },
  ];
}
export function resolveWorkTab(
  story: string | null,
  requested?: string,
): WorkTab {
  if (requested === 'delivery' || requested === 'details') return requested;
  return story?.trim() ? 'story' : 'details';
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
