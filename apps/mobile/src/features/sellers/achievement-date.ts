type AchievementDate = { year: number; month: number; day: number | null };

export function formatAchievementDate(value: AchievementDate): string {
  const date = new Date(Date.UTC(value.year, value.month - 1, value.day ?? 1));
  const month = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    timeZone: 'UTC',
  }).format(date);
  return `${month[0].toUpperCase()}${month.slice(1)}, ${date.getUTCFullYear()}`;
}

export function formatAuthorAchievementLabel(value: AchievementDate): string {
  const date = new Date(Date.UTC(value.year, value.month - 1, value.day ?? 1));
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const prefix = value.day === null ? '' : `${String(value.day).padStart(2, '0')}.`;
  return `${prefix}${month}.${date.getUTCFullYear()}`;
}
