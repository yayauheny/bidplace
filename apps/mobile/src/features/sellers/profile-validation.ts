import { sellerPublicEmailSchema, sellerPublicUrlSchema } from '@bidplace/contracts';

import { normalizeInstagram, normalizeTelegram } from './contact-normalization';

type PublicLinkField =
  | 'socialLink'
  | 'telegramUrl'
  | 'instagramUrl'
  | 'websiteUrl'
  | 'publicEmail';

export type ProfileFieldErrors = Partial<Record<PublicLinkField | 'city', string>>;

export function getPublicLinkError(value: string): string | undefined {
  if (!value.trim()) return undefined;
  return sellerPublicUrlSchema.safeParse(value.trim()).success
    ? undefined
    : 'Введите HTTPS-ссылку, начиная с https://';
}

export function getProfileFieldErrors(fields: {
  city: string;
  socialLink: string;
  telegramUrl: string;
  instagramUrl: string;
  websiteUrl: string;
  publicEmail?: string;
}): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};
  if (!fields.city.trim()) {
    errors.city = 'Укажите город';
  }
  const publicFields: Array<'socialLink' | 'websiteUrl'> = [
    'socialLink',
    'websiteUrl',
  ];

  for (const field of publicFields) {
    const error = getPublicLinkError(fields[field]);
    if (error) errors[field] = error;
  }

  if (fields.telegramUrl.trim() && normalizeTelegram(fields.telegramUrl) === undefined) {
    errors.telegramUrl = 'Введите Telegram username или HTTPS-ссылку';
  }
  if (fields.instagramUrl.trim() && normalizeInstagram(fields.instagramUrl) === undefined) {
    errors.instagramUrl = 'Введите Instagram username или HTTPS-ссылку';
  }
  if (
    fields.publicEmail?.trim() &&
    !sellerPublicEmailSchema.safeParse(fields.publicEmail).success
  ) {
    errors.publicEmail = 'Введите корректный email';
  }

  return errors;
}
