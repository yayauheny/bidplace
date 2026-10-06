import { achievementOccurredDateSchema } from '@bidplace/contracts';

type AchievementDate = { year: number; month: number; day: number | null };

export type AchievementDateFieldErrors = {
  year?: string;
  month?: string;
  day?: string;
};

export function presentAchievementDateGroup(message: string) {
  return /expected/i.test(message) ? 'Укажите существующую дату' : message;
}

export function achievementDateFieldErrors(input: {
  year: string;
  month: string;
  day: string;
}): AchievementDateFieldErrors | null {
  const parsed = achievementOccurredDateSchema.safeParse({
    year: Number(input.year.trim()),
    month: Number(input.month.trim()),
    day: input.day.trim() ? Number(input.day.trim()) : null,
  });
  if (parsed.success) return null;
  const errors: AchievementDateFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if ((key === 'year' || key === 'month' || key === 'day') && !errors[key]) {
      errors[key] = presentAchievementDateGroup(issue.message);
    }
  }
  return errors;
}

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
