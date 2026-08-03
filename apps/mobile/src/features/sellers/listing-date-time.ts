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

  const isoLocalMatch = trimmedValue.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
  );
  if (isoLocalMatch) {
    const [, year, month, day, hours, minutes] = isoLocalMatch;
    return serializeLocalDateTime(
      Number(year),
      Number(month),
      Number(day),
      Number(hours),
      Number(minutes),
    );
  }

  return parseDateTimeInputValue(trimmedValue);
}
