import { sellerPublicUrlSchema } from '@bidplace/contracts';

type PublicLinkField =
  | 'socialLink'
  | 'telegramUrl'
  | 'instagramUrl'
  | 'websiteUrl';

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
}): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};
  if (!fields.city.trim()) {
    errors.city = 'Укажите город';
  }
  const publicFields: PublicLinkField[] = [
    'socialLink',
    'telegramUrl',
    'instagramUrl',
    'websiteUrl',
  ];

  for (const field of publicFields) {
    const error = getPublicLinkError(fields[field]);
    if (error) errors[field] = error;
  }

  return errors;
}
