import {
  sellerPublicEmailSchema,
  sellerPublicUrlSchema,
  slugGrammarMessage,
  slugSchema,
} from '@bidplace/contracts';
import { z } from 'zod';

import { normalizeInstagram, normalizeTelegram } from './contact-normalization';

type PublicLinkField =
  | 'socialLink'
  | 'telegramUrl'
  | 'instagramUrl'
  | 'websiteUrl'
  | 'publicEmail';

export type ProfileFieldErrors = Partial<Record<PublicLinkField | 'city', string>>;

const profileDraftErrorFields = [
  'city',
  'socialLink',
  'telegramUrl',
  'instagramUrl',
  'websiteUrl',
  'publicEmail',
] as const satisfies ReadonlyArray<keyof ProfileFieldErrors>;

export function getPublicLinkError(value: string): string | undefined {
  if (!value.trim()) return undefined;
  return sellerPublicUrlSchema.safeParse(value.trim()).success
    ? undefined
    : 'Введите HTTPS-ссылку, начиная с https://';
}

function acceptsOptionalPublicLink(value: string) {
  return getPublicLinkError(value) === undefined;
}

function acceptsOptionalHandle(
  value: string,
  normalize: (input: string) => string | null | undefined,
) {
  if (!value.trim()) return true;
  return normalize(value) !== undefined;
}

function acceptsOptionalPublicEmail(value: string) {
  if (!value.trim()) return true;
  return sellerPublicEmailSchema.safeParse(value).success;
}

function acceptsProfileSlug(value: string) {
  if (!value.trim()) return true;
  return slugSchema.safeParse(value).success;
}

export const profileDraftSchema = z
  .object({
    slug: z.string().refine(acceptsProfileSlug, slugGrammarMessage),
    fullName: z.string(),
    discipline: z.string(),
    country: z.string(),
    city: z.string().refine((value) => value.trim().length > 0, 'Укажите город'),
    practice: z.string(),
    socialLink: z.string().refine(acceptsOptionalPublicLink, 'Введите HTTPS-ссылку, начиная с https://'),
    telegramUrl: z
      .string()
      .refine(
        (value) => acceptsOptionalHandle(value, normalizeTelegram),
        'Введите Telegram username или HTTPS-ссылку',
      ),
    instagramUrl: z
      .string()
      .refine(
        (value) => acceptsOptionalHandle(value, normalizeInstagram),
        'Введите Instagram username или HTTPS-ссылку',
      ),
    websiteUrl: z.string().refine(acceptsOptionalPublicLink, 'Введите HTTPS-ссылку, начиная с https://'),
    publicEmail: z.string().refine(acceptsOptionalPublicEmail, 'Введите корректный email'),
    shortDescription: z.string(),
  })
  .strict();

const emptyProfileDraft = {
  slug: '',
  fullName: '',
  discipline: '',
  country: '',
  city: '',
  practice: '',
  socialLink: '',
  telegramUrl: '',
  instagramUrl: '',
  websiteUrl: '',
  publicEmail: '',
  shortDescription: '',
};

export function getProfileFieldErrors(fields: {
  city: string;
  socialLink: string;
  telegramUrl: string;
  instagramUrl: string;
  websiteUrl: string;
  publicEmail?: string;
}): ProfileFieldErrors {
  const parsed = profileDraftSchema.safeParse({
    ...emptyProfileDraft,
    ...fields,
    publicEmail: fields.publicEmail ?? '',
  });
  if (parsed.success) return {};
  const errors: ProfileFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (typeof key !== 'string') continue;
    if (!profileDraftErrorFields.includes(key as (typeof profileDraftErrorFields)[number])) continue;
    const field = key as keyof ProfileFieldErrors;
    if (!errors[field]) errors[field] = issue.message;
  }
  return errors;
}

export function profileDraftAllowsSave(fields: z.input<typeof profileDraftSchema>): boolean {
  return profileDraftSchema.safeParse(fields).success;
}
