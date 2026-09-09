import { Redirect, useLocalSearchParams, type Href } from 'expo-router';

export default function WorkShareAlias() {
  const { publicId } = useLocalSearchParams<{ publicId: string }>();
  return <Redirect href={`/product/${publicId}` as Href} />;
}
