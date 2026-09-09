import {
  sellerInstagramHandleSchema,
  sellerPhoneHandleSchema,
  sellerPublicUrlSchema,
  sellerTelegramHandleSchema,
} from '@bidplace/contracts';

type HandoffContactType = 'TELEGRAM' | 'PHONE' | 'INSTAGRAM';
type PublicLinkField =
  | 'socialLink'
  | 'telegramUrl'
  | 'instagramUrl'
  | 'websiteUrl';

export type ProfileFieldErrors = Partial<
  Record<PublicLinkField | 'handoffContactValue' | 'city', string>
>;

export function getPublicLinkError(value: string): string | undefined {
  if (!value.trim()) return undefined;
  return sellerPublicUrlSchema.safeParse(value.trim()).success
    ? undefined
    : 'Введите HTTPS-ссылку, начиная с https://';
}

export function getHandoffContactError(
  type: HandoffContactType,
  value: string,
): string | undefined {
  if (!value.trim()) return undefined;

  const schema = {
    TELEGRAM: sellerTelegramHandleSchema,
    PHONE: sellerPhoneHandleSchema,
    INSTAGRAM: sellerInstagramHandleSchema,
  }[type];

  if (schema.safeParse(value.trim()).success) return undefined;
  if (type === 'TELEGRAM') {
    return 'Введите Telegram @username или https://t.me/username';
  }
  if (type === 'INSTAGRAM') {
    return 'Введите Instagram @username или https://instagram.com/username';
  }
  return 'Введите телефон в международном формате, например +375291234567';
}

export function getProfileFieldErrors(fields: {
  city?: string;
  socialLink: string;
  telegramUrl: string;
  instagramUrl: string;
  websiteUrl: string;
  handoffContactType: HandoffContactType;
  handoffContactValue: string;
}): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};
  if (!fields.city?.trim()) {
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

  const handoffError = getHandoffContactError(
    fields.handoffContactType,
    fields.handoffContactValue,
  );
  if (handoffError) errors.handoffContactValue = handoffError;
  return errors;
}
