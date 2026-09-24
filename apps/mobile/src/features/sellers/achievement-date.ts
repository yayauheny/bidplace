type AchievementDate = { year: number; month: number; day: number | null };

export function formatAchievementDate(value: AchievementDate): string {
  const date = new Date(Date.UTC(value.year, value.month - 1, value.day ?? 1));
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    day: value.day === null ? undefined : 'numeric',
    month: 'long',
    year: value.day === null ? undefined : 'numeric',
    timeZone: 'UTC',
  });
  const formatted = formatter.format(date);
  if (value.day !== null) return formatted;
  return `${formatted[0].toUpperCase()}${formatted.slice(1)}, ${date.getUTCFullYear()}`;
}

export function formatAuthorAchievementLabel(value: AchievementDate): string {
  const date = new Date(Date.UTC(value.year, value.month - 1, value.day ?? 1));
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const prefix = value.day === null ? '' : `${String(value.day).padStart(2, '0')}.`;
  return `${prefix}${month}.${date.getUTCFullYear()}`;
}
