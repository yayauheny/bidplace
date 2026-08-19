import type { PublicDiscoverySort } from '@bidplace/contracts';

export type PriceRangeKey = 'under-500' | '500-1500' | '1500-plus';

export const priceRangeOptions: Array<{
  value: PriceRangeKey;
  label: string;
  min?: number;
  max?: number;
}> = [
  { value: 'under-500', label: 'До 500 BYN', max: 500 },
  { value: '500-1500', label: '500–1 500 BYN', min: 500, max: 1500 },
  { value: '1500-plus', label: 'От 1 500 BYN', min: 1500 },
];

export const sortOptions: Array<{
  value: PublicDiscoverySort;
  label: string;
}> = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'activity', label: 'По активности' },
  { value: 'endingSoon', label: 'Скоро завершатся' },
  { value: 'priceAsc', label: 'Сначала дешевле' },
  { value: 'priceDesc', label: 'Сначала дороже' },
];

