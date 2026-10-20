import { z } from 'zod';

export const legalDocumentIdSchema = z.enum([
  'agreement',
  'privacy',
  'data-consent',
  'author-rules',
  'prohibited',
]);

export const legalDocumentsResponseSchema = z.object({
  version: z.string().min(1),
  documents: z.array(z.object({
    id: legalDocumentIdSchema,
    title: z.string().min(1),
    version: z.string().min(1),
    markdown: z.string().min(1),
  }).strict()),
}).strict();

const versionedAction = z.object({
  version: z.string().min(1).optional(),
  confirmed: z.literal(true),
}).strict();

export const registrationLegalSchema = z.object({
  agreement: versionedAction,
  privacy: versionedAction,
  dataConsent: versionedAction,
  age18Confirmed: z.literal(true),
}).strict();

export type LegalDocumentId = z.infer<typeof legalDocumentIdSchema>;
export type LegalDocumentsResponse = z.infer<typeof legalDocumentsResponseSchema>;
export type RegistrationLegal = z.infer<typeof registrationLegalSchema>;
