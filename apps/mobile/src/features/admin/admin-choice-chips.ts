export const adminAnalyticsPeriodChips = [
  { value: 'today', label: 'Сегодня' },
  { value: '7d', label: '7 дней' },
  { value: '30d', label: '30 дней' },
  { value: '90d', label: '90 дней' },
] as const;

export const adminModerationQueueTabs = [
  { id: 'authors', label: 'Авторы' },
  { id: 'works', label: 'Работы' },
  { id: 'orders', label: 'Заказы' },
  { id: 'users', label: 'Пользователи' },
  { id: 'recovery', label: 'Восстановление' },
] as const;

export const adminModerationStatusFilters = [
  { id: 'PENDING_REVIEW', label: 'Ожидают проверки' },
  { id: 'APPROVED', label: 'Одобрены' },
  { id: 'CHANGES_REQUESTED', label: 'Нужны правки' },
  { id: 'ALL', label: 'Все статусы' },
] as const;

export type AdminAnalyticsPeriodChip =
  (typeof adminAnalyticsPeriodChips)[number]['value'];
export type AdminModerationQueueTab =
  (typeof adminModerationQueueTabs)[number]['id'];
export type AdminModerationStatusFilter =
  (typeof adminModerationStatusFilters)[number]['id'];
