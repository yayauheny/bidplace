import { parseDateTimeInputValue } from '../../lib/presentation';

function serializeLocalDateTime(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
): string | null {
  const date = new Date(year, month - 1, day, hours, minutes);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hours ||
    date.getMinutes() !== minutes
  ) {
    return null;
  }

  return date.toISOString();
}

export function parseListingDateTime(value: string): string | null {
  const trimmedValue = value.trim();
  const localMatch = trimmedValue.match(
    /^(\d{2})\.(\d{2})\.(\d{4}),?\s+(\d{2}):(\d{2})$/,
  );
  if (localMatch) {
    const [, day, month, year, hours, minutes] = localMatch;
    return serializeLocalDateTime(
      Number(year),
      Number(month),
      Number(day),
      Number(hours),
      Number(minutes),
    );
  }

  const isoLike = /^\d{4}-\d{2}-\d{2}/.test(trimmedValue);
  if (isoLike) {
    const isoMatch = trimmedValue.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:?\d{2})?$/,
    );
    if (!isoMatch) return null;

    const [, year, month, day, hours, minutes, seconds, fraction, offset] =
      isoMatch;
    const calendarDate = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day)),
    );
    const validCalendar =
      calendarDate.getUTCFullYear() === Number(year) &&
      calendarDate.getUTCMonth() === Number(month) - 1 &&
      calendarDate.getUTCDate() === Number(day);
    const validClock =
      Number(hours) <= 23 &&
      Number(minutes) <= 59 &&
      (seconds === undefined || Number(seconds) <= 59);
    const validFraction =
      fraction === undefined || Number(fraction.padEnd(3, '0')) <= 999;
    const validOffset =
      offset === undefined ||
      offset === 'Z' ||
      (() => {
        const offsetMatch = offset.match(/[+-](\d{2}):?(\d{2})/);
        return (
          offsetMatch !== null &&
          Number(offsetMatch[1]) <= 23 &&
          Number(offsetMatch[2]) <= 59
        );
      })();

    if (!validCalendar || !validClock || !validFraction || !validOffset) {
      return null;
    }
    return parseDateTimeInputValue(trimmedValue);
  }

  return null;
}
