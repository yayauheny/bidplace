import type { OrderDetail } from '@bidplace/contracts';
import { formatMoney } from '../../lib/money';
import { formatOrderStamp, orderSourceLabel } from './order-view';
import type { ReceiptCard } from '../../lib/share-card/templates';

export function receiptData(order: OrderDetail): ReceiptCard {
  if (order.status !== 'COMPLETED' || (order.role !== 'buyer' && order.role !== 'seller') || !order.completedAt) {
    throw new Error('Подтверждение сделки недоступно.');
  }
  return {
    workTitle: order.workTitle,
    author: order.sellerNameSnapshot,
    publicId: order.publicId,
    dealCode: order.dealCode,
    amount: formatMoney(order.amountMinor, order.currency),
    completedAt: formatOrderStamp(order.completedAt),
    source: orderSourceLabel(order.source),
  };
}
