import { z } from 'zod';

function hasMoneyPrecision(value: number): boolean {
  const scaled = value * 100;

  return Number.isSafeInteger(Math.round(scaled)) && Math.abs(scaled - Math.round(scaled)) < 1e-9;
}

export const uuidSchema = z.string().uuid();
export const isoDateTimeSchema = z.string().datetime();
export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
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
