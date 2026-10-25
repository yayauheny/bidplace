import { Redirect, useLocalSearchParams } from 'expo-router';
import { legacyExploreHref } from '../../features/explore/explore-route';
export default function LegacyRoute() {
  const params = useLocalSearchParams();
  return <Redirect href={legacyExploreHref('works', params)} />;
}
