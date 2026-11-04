import { useLocalSearchParams } from 'expo-router';

import { DealContactsScreen } from '../../../features/account/deal-contacts-screen';
import { dealContactsRedirect } from '../../../features/account/deal-contacts';

export default function AccountContactsRoute() {
  const { redirectTo } = useLocalSearchParams<{
    redirectTo?: string | string[];
  }>();
  return <DealContactsScreen redirectTo={dealContactsRedirect(redirectTo)} />;
}
