import { achievementOccurredDateSchema } from '@bidplace/contracts';

type AchievementDate = { year: number; month: number; day: number | null };

export function presentAchievementDateGroup(message: string) {
  return /expected/i.test(message) ? 'Укажите существующую дату' : message;
}

export function parseAchievementDateInput(
  value: string,
): { date: AchievementDate; error: null } | { date: null; error: string } {
  const match = /^(?:(\d{1,2})\.)?(\d{1,2})\.(\d{4})$/.exec(value.trim());
  if (!match)
    return {
      date: null,
      error: 'Введите дату в формате ММ.ГГГГ или ДД.ММ.ГГГГ',
    };
  const parsed = achievementOccurredDateSchema.safeParse({
    year: Number(match[3]),
    month: Number(match[2]),
    day: match[1] ? Number(match[1]) : null,
  });
  return parsed.success
    ? { date: parsed.data, error: null }
    : {
        date: null,
        error: parsed.error.issues
          .map((issue) => presentAchievementDateGroup(issue.message))
          .join(' '),
      };
}

export function formatAchievementDate(value: AchievementDate): string {
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

export function formatAuthorAchievementLabel(value: AchievementDate): string {
  const month = String(value.month).padStart(2, '0');
  const prefix =
    value.day === null ? '' : `${String(value.day).padStart(2, '0')}.`;
  return `${prefix}${month}.${String(value.year).padStart(4, '0')}`;
}
