export function formatAchievementDate(value: string): string {
  const date = new Date(value);
  const month = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    timeZone: 'UTC',
  }).format(date);
  return `${month[0].toUpperCase()}${month.slice(1)}, ${date.getUTCFullYear()}`;
}
