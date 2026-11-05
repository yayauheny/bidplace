import type { ShareFormat } from './layout';

export type WorkCard = {
  title: string;
  handle: string;
  link: string;
  price: string | null;
  timer: string | null;
  status: string | null;
  description: string | null;
};
export type ReceiptCard = {
  workTitle: string;
  author: string;
  publicId: string;
  dealCode: string;
  amount: string;
  completedAt: string;
  source: string;
};
export type CardLayer =
  | { kind: 'image'; fit: 'cover' | 'contain'; x: number; y: number; width: number; height: number; background?: 'blur' }
  | { kind: 'logo'; x: number; y: number; width: number }
  | { kind: 'pills'; y: number; rows: string[][] }
  | { kind: 'text'; x: number; y: number; width: number; text: string; size: number; lines: number; color: 'light' | 'dark'; chip?: boolean };

export function workTemplate(format: ShareFormat, work: WorkCard): CardLayer[] {
  const logoY = format === 'story' ? 0.244 : format === 'original' ? 0.45 : 0.04;
  const logoWidth = format === 'original' ? 0.455 : 0.398;
  const sale = [work.price, work.timer].filter((value): value is string => Boolean(value));
  const rows = format === 'original' ? [[`@${work.handle}`], [work.title], ...(work.status ? [[work.status]] : []), ...(sale.length ? [sale] : [])] : [[`@${work.handle}`], ...(sale.length ? [sale] : []), [work.title], ...(work.status ? [[work.status]] : [])];
  const layers: CardLayer[] = [
    { kind: 'image', fit: 'contain', x: 0, y: 0, width: 1, height: 1, ...(format === 'original' ? {} : { background: 'blur' as const }) },
    { kind: 'logo', x: (1 - logoWidth) / 2, y: logoY, width: logoWidth },
    { kind: 'pills', y: logoY + 0.07, rows },
  ];
  layers.push({ kind: 'text', x: 0.08, y: 0.94, width: 0.84, text: work.link, size: 0.025, lines: 1, color: 'dark', chip: true });
  if (work.description) layers.push({ kind: 'text', x: 0.08, y: 0.8, width: 0.84, text: work.description, size: 0.037, lines: 3, color: 'light' });
  return layers;
}

export function receiptTemplate(receipt: ReceiptCard): CardLayer[] {
  return [
    { kind: 'logo', x: 0.7, y: 0.03, width: 0.24 },
    { kind: 'image', fit: 'cover', x: 0.06, y: 0.16, width: 0.3, height: 0.28 },
    { kind: 'text', x: 0.06, y: 0.06, width: 0.88, text: 'Подтверждение сделки', size: 0.05, lines: 2, color: 'dark' },
    { kind: 'text', x: 0.4, y: 0.18, width: 0.54, text: receipt.workTitle, size: 0.045, lines: 3, color: 'dark' },
    { kind: 'text', x: 0.4, y: 0.32, width: 0.54, text: receipt.author, size: 0.034, lines: 2, color: 'dark' },
    { kind: 'text', x: 0.06, y: 0.49, width: 0.88, text: `Заказ ${receipt.publicId} · Код ${receipt.dealCode}`, size: 0.034, lines: 2, color: 'dark' },
    { kind: 'text', x: 0.06, y: 0.58, width: 0.88, text: receipt.amount, size: 0.05, lines: 1, color: 'dark' },
    { kind: 'text', x: 0.06, y: 0.66, width: 0.88, text: `${receipt.completedAt} · ${receipt.source}`, size: 0.032, lines: 2, color: 'dark' },
    { kind: 'text', x: 0.06, y: 0.80, width: 0.88, text: 'Не является кассовым чеком', size: 0.034, lines: 2, color: 'dark' },
    { kind: 'text', x: 0.06, y: 0.88, width: 0.88, text: 'bidplace — технологическая площадка, не принимает оплату и не участвует в передаче', size: 0.026, lines: 3, color: 'dark' },
  ];
}
