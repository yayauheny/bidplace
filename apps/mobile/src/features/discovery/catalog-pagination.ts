export function nextCatalogPage(pagination: {
  page: number;
  limit: number;
  total: number;
}) {
  return pagination.page * pagination.limit < pagination.total
    ? pagination.page + 1
    : undefined;
}

export function uniqueCatalogItems<Item>(
  items: Item[],
  getId: (item: Item) => string,
) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = getId(item);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
