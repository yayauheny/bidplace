import { designTokens } from '@bidplace/design-tokens';
import {
  portfolioAuthorSchema,
  portfolioWorkSchema,
} from '@bidplace/contracts';

export function publicShareTarget(sharePath: string, origin: string) {
  const valid =
    portfolioAuthorSchema.shape.sharePath.safeParse(sharePath).success ||
    portfolioWorkSchema.shape.sharePath.safeParse(sharePath).success;
  if (!valid) throw new Error('Invalid public share path');
  return {
    url: new URL(sharePath, origin).toString(),
    filename: `bidplace-${sharePath.split('/').at(-1)}.png`,
  };
}

// Single typed owner of the public author route. Unpublished/missing slug has
// no public path — callers surface the claim flow instead of building
// /authors/null.
export function authorSharePath(slug: string): `/authors/${string}` {
  return `/authors/${slug}`;
}

export {
  copyPublicLink,
  downloadQrPng,
  publicShareOrigin,
} from './share-platform';

export const publicQrOptions = {
  type: 'image/png',
  width: 656,
  margin: 4,
  errorCorrectionLevel: 'M',
  color: {
    dark: designTokens.qr.foreground,
    light: designTokens.qr.background,
  },
} as const;
