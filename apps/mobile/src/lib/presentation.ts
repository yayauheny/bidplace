export const sellerStatusLabels = {
  DRAFT: 'Черновик',
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
