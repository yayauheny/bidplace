export type ProductTabId = 'about' | 'creation' | 'bids';

export const productTabs: ReadonlyArray<{
  id: ProductTabId;
  label: string;
}> = [
  { id: 'about', label: 'О работе' },
  { id: 'creation', label: 'Создание' },
  { id: 'bids', label: 'Торги' },
];

export function parseProductTabParam(
  value: string | readonly string[] | undefined,
): ProductTabId {
  const candidate = Array.isArray(value) ? value[0] : value;
  return productTabs.some((tab) => tab.id === candidate)
    ? (candidate as ProductTabId)
    : 'about';
}

export function getProductTabAt(index: number): ProductTabId {
  const normalizedIndex =
    ((index % productTabs.length) + productTabs.length) % productTabs.length;
  return productTabs[normalizedIndex].id;
}
