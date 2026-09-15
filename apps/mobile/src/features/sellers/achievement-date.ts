export function formatAchievementDate(value: string): string {
  const date = new Date(value);
  const month = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    timeZone: 'UTC',
  }).format(date);
  return `${month[0].toUpperCase()}${month.slice(1)}, ${date.getUTCFullYear()}`;
}

export function formatAuthorAchievementLabel(value: string): string {
  const date = new Date(value);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${month}.${date.getUTCFullYear()}`;
}
