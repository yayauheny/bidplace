import { Redirect, useLocalSearchParams } from 'expo-router';

export default function AuthorShareAlias() {
  const { slug, sort, category, categories } = useLocalSearchParams<{
    slug: string;
    sort?: string;
    category?: string;
    categories?: string;
  }>();
  return (
    <Redirect
      href={{
        pathname: '/seller/[slug]',
        params: {
          slug,
          ...(sort ? { sort } : {}),
          ...(category ? { category } : {}),
          ...(categories ? { categories } : {}),
        },
      }}
    />
  );
}
