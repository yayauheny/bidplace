import { useLocalSearchParams } from 'expo-router'; import { OrderScreen } from '../../features/orders/order-screen';
export default function OrderRoute() { const { publicId } = useLocalSearchParams<{ publicId: string }>(); return <OrderScreen publicId={publicId} />; }
