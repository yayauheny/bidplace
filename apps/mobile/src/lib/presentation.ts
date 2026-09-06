import type { ActivityStatus, ListingStatus } from '@bidplace/contracts';

export const sellerStatusLabels = {
  APPROVED: 'Одобрен',
  PENDING_REVIEW: 'На модерации',
  CHANGES_REQUESTED: 'Нужны правки',
  REJECTED: 'Отклонён',
  SUSPENDED: 'Приостановлен',
} as const;

export const productStatusLabels = {
  DRAFT: 'Черновик',
  PENDING_REVIEW: 'На модерации',
  CHANGES_REQUESTED: 'Нужны правки',
  APPROVED: 'Одобрен',
  REJECTED: 'Отклонён',
  ARCHIVED: 'В архиве',
} as const;

export const listingStatusLabels = {
  DRAFT: 'Черновик',
  SCHEDULED: 'Запланирован',
  LIVE: 'Торги идут',
  ENDED: 'Завершён',
  CANCELLED: 'Отменён',
} as const;

// Auction surfaces (product detail) intentionally use different wording than
// the generic listingStatusLabels above.
export const auctionListingStatusLabels = {
  SCHEDULED: 'Торги запланированы',
  LIVE: 'Торги идут',
  ENDED: 'Торги завершены',
  CANCELLED: 'Размещение отменено',
  DRAFT: 'Черновик размещения',
} as const satisfies Record<ListingStatus, string>;

export const orderStatusLabels = {
  PENDING_CONTACT: 'Ожидает контакта',
  CONTACTED: 'Контакт установлен',
  COMPLETED: 'Завершён',
  HANDOFF_FAILED: 'Передача не состоялась',
  CANCELLED: 'Отменён',
} as const;

export const auctionParticipationLabels = {
  LEADING: 'Побеждаете',
  OUTBID: 'Ставка перебита',
  WON: 'Выиграли',
  LOST: 'Торги завершены',
  AUCTION_CANCELLED: 'Торги отменены',
  AWAITING_SELLER_CONTACT: 'Ожидается связь с автором',
  CONTACTED: 'Связались',
  HANDOFF_FAILED: 'Сделка не состоялась',
  WIN_CANCELLED: 'Покупка отменена',
  COMPLETED: 'Покупка завершена',
} as const satisfies Record<ActivityStatus, string>;

export function auctionListingStatusTone(
  status: ListingStatus,
): 'accent' | 'success' | 'secondary' | 'danger' {
  if (status === 'LIVE') return 'success';
  if (status === 'SCHEDULED') return 'accent';
  if (status === 'CANCELLED') return 'danger';
  return 'secondary';
}

export function auctionParticipationTone(
  status: ActivityStatus,
): 'accent' | 'success' | 'secondary' | 'danger' {
  if (status === 'LEADING' || status === 'WON' || status === 'CONTACTED') {
    return 'success';
  }
  if (status === 'OUTBID') return 'accent';
  if (
    status === 'HANDOFF_FAILED' ||
    status === 'WIN_CANCELLED' ||
    status === 'AUCTION_CANCELLED'
  ) {
    return 'danger';
  }
  return 'secondary';
}

export const sellerTypeLabels = {
  creator: 'Создатель',
  influencer: 'Публичный человек',
} as const;

export const cancellationReasonLabels = {
  BUYER_DECLINED: 'Покупатель отказался',
  BUYER_UNREACHABLE: 'Покупатель недоступен',
  ADMIN_CANCELLED: 'Отменено администратором',
} as const;

export const handoffContactTypeLabels = {
  TELEGRAM: 'Telegram',
  PHONE: 'Телефон',
  INSTAGRAM: 'Instagram',
} as const;

export const handoffInitiatorLabels = {
  BUYER_CONTACTS_SELLER: 'Покупатель связывается с продавцом',
  SELLER_CONTACTS_BUYER: 'Продавец связывается с покупателем',
} as const;

export function presentEnum(
  value: string,
  labels: Readonly<Record<string, string>>,
  fallback: string,
) {
  return labels[value] ?? fallback;
}

function pad(value: number) {
  return value.toString().padStart(2, '0');
}

export function toDateTimeInputValue(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parseDateTimeInputValue(value: string) {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
