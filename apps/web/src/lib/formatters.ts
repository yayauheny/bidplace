const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatCurrencyAmount(value: number, currency = 'USD') {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value);
}

export function formatDateTime(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return timeFormatter.format(date);
}

export function formatRelativeTime(value: string | Date) {
  const target = typeof value === 'string' ? new Date(value).getTime() : value.getTime();
  const diff = target - Date.now();
  const totalSeconds = Math.max(0, Math.floor(diff / 1000));

  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days} д ${hours} ч`;
  }

  if (hours > 0) {
    return `${hours} ч ${minutes} м`;
  }

  if (minutes > 0) {
    return `${minutes} м ${seconds} с`;
  }

  return `${seconds} с`;
}

export function formatDurationRange(startAt: string | Date, endAt: string | Date) {
  return `${formatDateTime(startAt)} - ${formatDateTime(endAt)}`;
}
