import { Redirect, useLocalSearchParams, type Href } from 'expo-router';

export default function AuthorShareAlias() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <Redirect href={`/seller/${slug}` as Href} />;
}
