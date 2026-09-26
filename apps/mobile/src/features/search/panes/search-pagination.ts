export function searchPaginationView<Item>(input: {
  items: Item[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}) {
  return {
    items: input.items,
    nextPage: input.hasNextPage
      ? {
          label: 'Показать ещё',
          loading: input.isFetchingNextPage,
        }
      : null,
  };
}
