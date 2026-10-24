import { useLocalSearchParams } from 'expo-router';
import { AdminModerationDetail } from '../../../../features/admin/admin-moderation-detail';
export default function ModerationDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AdminModerationDetail key={id} id={id} kind="products" />;
}
