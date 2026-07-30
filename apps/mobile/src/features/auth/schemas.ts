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
    password: z.string({ required_error: 'Введите пароль' }).min(8, 'Пароль должен содержать не менее 8 символов'),
    phone: z.string().trim().min(1).nullable().optional(),
    displayName: z.string({ required_error: 'Введите имя' }).trim().min(1, 'Введите имя'),
  })
  .strict();

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
