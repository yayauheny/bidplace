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

export function presentEnum(
  value: string,
  labels: Readonly<Record<string, string>>,
  fallback: string,
) {
  return labels[value] ?? fallback;
}
