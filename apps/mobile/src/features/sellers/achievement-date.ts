import {
  formatCalendarDateInput,
  type CalendarDateValue as AchievementDate,
} from '../../lib/calendar-date';
export {
  parseCalendarDateInput as parseAchievementDateInput,
  presentCalendarDateError as presentAchievementDateGroup,
} from '../../lib/calendar-date';

export function formatAchievementDate(value: AchievementDate | null): string {
  if (!value) return 'Дата не указана';
  const date = new Date(0);
  date.setUTCFullYear(value.year, value.month - 1, value.day ?? 1);
  const formatted = new Intl.DateTimeFormat('ru-RU', {
    day: value.day === null ? undefined : 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(date);
  const year = String(value.year).padStart(4, '0');
  if (value.day !== null) return `${formatted} ${year} г.`;
  return `${formatted[0].toUpperCase()}${formatted.slice(1)}, ${year}`;
}

export function formatAuthorAchievementLabel(
  value: AchievementDate | null,
): string {
  return value ? formatCalendarDateInput(value) : 'Дата не указана';
}
