import { HomeScreen } from '../features/home/home-screen';

import { PublicNavigationProvider } from '../components/layout/public-navigation';

export default function IndexRoute() {
  return (
    <PublicNavigationProvider>
      <HomeScreen />
    </PublicNavigationProvider>
  );
}
