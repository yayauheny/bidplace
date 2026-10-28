import type { Category } from '@bidplace/contracts';

export type SearchCategory = Pick<Category, 'id' | 'slug' | 'name'>;

export function filterCategoriesByQuery(
  categories: readonly SearchCategory[],
  query: string,
): SearchCategory[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [...categories];

  return categories.filter((category) => {
    return (
      category.name.toLocaleLowerCase().includes(needle) ||
      category.slug.toLocaleLowerCase().includes(needle)
    );
  });
}
