import { loginRequestSchema, registerRequestSchema } from '@bidplace/contracts';
import { z } from 'zod';

export const loginFormSchema = loginRequestSchema;

export const registerFormSchema = registerRequestSchema;

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
