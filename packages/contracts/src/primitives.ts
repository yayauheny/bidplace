import { z } from 'zod';

function hasMoneyPrecision(value: number): boolean {
  const scaled = value * 100;

  return Number.isSafeInteger(Math.round(scaled)) && Math.abs(scaled - Math.round(scaled)) < 1e-9;
}

export const uuidSchema = z.string().uuid();
export const isoDateTimeSchema = z.string().datetime();

export const slugGrammarMessage =
  'Используйте маленькие латинские буквы и цифры. Между ними можно поставить дефис или подчёркивание.';

const slugPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export function slugTextSchema(requiredMessage: string) {
  return z.string().trim().min(1, requiredMessage).regex(slugPattern, slugGrammarMessage);
}

export const slugSchema = slugTextSchema(slugGrammarMessage);
export const currencyCodeSchema = z
  .string()
  .trim()
  .length(3)
  .regex(/^[A-Z]{3}$/);
export const moneyAmountSchema = z
  .number()
  .finite()
  .nonnegative()
  .refine(hasMoneyPrecision, {
    message: 'amount must have at most two decimal places',
  });

export const httpsUrlSchema = z
  .string()
  .trim()
  .url()
  .refine(
    (value) => {
      try {
        return new URL(value).protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Введите HTTPS-ссылку, начиная с https://' },
  );

const achievementYearSchema = z
  .number({
    invalid_type_error: 'Укажите год числом',
    required_error: 'Укажите год числом',
  })
  .int('Укажите год целым числом')
  .min(1, 'Укажите год от 1 до 9999')
  .max(9_999, 'Укажите год от 1 до 9999');

const achievementMonthSchema = z
  .number({
    invalid_type_error: 'Укажите месяц числом',
    required_error: 'Укажите месяц числом',
  })
  .int('Укажите месяц целым числом')
  .min(1, 'Укажите месяц от 1 до 12')
  .max(12, 'Укажите месяц от 1 до 12');

const achievementDaySchema = z
  .number({
    invalid_type_error: 'Укажите день числом',
    required_error: 'Укажите день числом',
  })
  .int('Укажите день целым числом')
  .min(1, 'Укажите день от 1 до 31')
  .max(31, 'Укажите день от 1 до 31')
  .nullable();

export const achievementOccurredDateSchema = z
  .object({
    year: achievementYearSchema,
    month: achievementMonthSchema,
    day: achievementDaySchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.day === null) return;
    if (value.day > new Date(Date.UTC(value.year, value.month, 0)).getUTCDate()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['day'],
        message: 'Укажите существующую дату',
      });
    }
  });
