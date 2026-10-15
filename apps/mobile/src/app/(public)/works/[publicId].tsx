import { Redirect, useLocalSearchParams } from 'expo-router';

export default function WorkShareAlias() {
  const { publicId, tab } = useLocalSearchParams<{
    publicId: string;
    tab?: string;
  }>();
  return (
    <Redirect
      href={{
        pathname: '/product/[publicId]',
        params: { publicId, ...(tab ? { tab } : {}) },
      }}
    />
  );
}
