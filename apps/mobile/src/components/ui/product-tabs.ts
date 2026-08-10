export type ProductTabId = 'about' | 'creation' | 'bids';

export const productTabs: ReadonlyArray<{
  id: ProductTabId;
  label: string;
}> = [
  { id: 'about', label: 'О работе' },
  { id: 'creation', label: 'Создание' },
  { id: 'bids', label: 'Ставки' },
];

export function getProductTabAt(index: number): ProductTabId {
  const normalizedIndex =
    ((index % productTabs.length) + productTabs.length) % productTabs.length;
  return productTabs[normalizedIndex].id;
}
