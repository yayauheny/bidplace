import { passwordSchema } from '@bidplace/contracts';
import { z } from 'zod';

const emailField = z
  .string({ required_error: 'Введите email' })
  .email('Введите корректный email');

export const loginFormSchema = z
  .object({
    email: emailField,
    password: z.string({ required_error: 'Введите пароль' }).min(1, 'Введите пароль'),
  })
  .strict();

export const registerFormSchema = z
  .object({
    email: emailField,
    password: passwordSchema,
    phone: z.string().trim().transform((value) => value || null).nullable().optional(),
    displayName: z.string({ required_error: 'Введите имя' }).trim().min(1, 'Введите имя'),
  })
  .strict();

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const forgotPasswordFormSchema = z
  .object({
    email: emailField,
  })
  .strict();

export const resetPasswordFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z
      .string({ required_error: 'Подтвердите пароль' })
      .min(1, 'Подтвердите пароль'),
  })
  .strict()
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
