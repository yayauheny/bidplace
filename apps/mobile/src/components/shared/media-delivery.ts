import type { SellerProductDetailResponse } from '@bidplace/contracts';

export type MediaDelivery = SellerProductDetailResponse['publication'];
export function mediaDeliveryPending(delivery: MediaDelivery): boolean {
  return Boolean(
    delivery && ['PENDING', 'RUNNING', 'FAILED'].includes(delivery.state),
  );
}
export function mediaDeliveryMessage(delivery: MediaDelivery): string | null {
  if (!mediaDeliveryPending(delivery)) return null;
  return delivery?.state === 'FAILED'
    ? 'Доставка медиа задерживается. Повторим автоматически.'
    : 'Публикация ожидает доставки медиа. Новая версия появится после завершения.';
}
