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

export const achievementOccurredDateSchema = z
  .object({
    year: z.number().int().min(1, 'Укажите существующую дату').max(9_999, 'Укажите существующую дату'),
    month: z.number().int().min(1, 'Укажите существующую дату').max(12, 'Укажите существующую дату'),
    day: z.number().int().min(1, 'Укажите существующую дату').max(31, 'Укажите существующую дату').nullable(),
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
