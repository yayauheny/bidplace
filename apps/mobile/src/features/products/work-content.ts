import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';

export type WorkTab = 'story' | 'details' | 'delivery';
export type WorkHistoryImage = { id: string; url: string };
export type WorkHistoryBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; image: WorkHistoryImage };

export function workHistoryBlocks(
  story: string | null,
  images: readonly WorkHistoryImage[],
): WorkHistoryBlock[] {
  const paragraphs = (story ?? '')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const extras = images.slice(1);
  const count = Math.max(paragraphs.length, extras.length);
  const blocks: WorkHistoryBlock[] = [];
  for (let index = 0; index < count; index += 1) {
    const paragraph = paragraphs[index];
    if (paragraph) {
      blocks.push({ type: 'text', text: paragraph });
    }
    const image = extras[index];
    if (image) {
      blocks.push({ type: 'image', image });
    }
  }
  return blocks;
}

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
