import { achievementOccurredDateSchema } from '@bidplace/contracts';

export type CalendarDateValue = {
  year: number;
  month: number;
  day: number | null;
};

export function presentCalendarDateError(message: string) {
  return /expected/i.test(message) ? 'Укажите существующую дату' : message;
}

export function parseCalendarDateInput(
  value: string,
): { date: CalendarDateValue; error: null } | { date: null; error: string } {
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
          .map((issue) => presentCalendarDateError(issue.message))
          .join(' '),
      };
}

export function formatCalendarDateInput(
  value: CalendarDateValue | null,
): string {
  if (!value) return '';
  const month = String(value.month).padStart(2, '0');
  const prefix =
    value.day === null ? '' : `${String(value.day).padStart(2, '0')}.`;
  return `${prefix}${month}.${String(value.year).padStart(4, '0')}`;
}
