import { type SellerProfile } from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';

import {
  parseSellerStatus,
  parseSellerType,
} from '../core/contracts';

export const sellerProfileContractSelect = {
  id: true,
  userId: true,
  slug: true,
  sellerType: true,
  storeName: true,
  country: true,
  contactPreference: true,
  socialLink: true,
  shortDescription: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SellerProfileSelect;

export type SellerProfileContractRecord = Prisma.SellerProfileGetPayload<{
  select: typeof sellerProfileContractSelect;
}>;

export function toContractSellerProfile(
  sellerProfile: SellerProfileContractRecord,
): SellerProfile {
  return {
    id: sellerProfile.id,
    userId: sellerProfile.userId,
    slug: sellerProfile.slug,
    sellerType: parseSellerType(sellerProfile.sellerType, sellerProfile.id),
    storeName: sellerProfile.storeName,
    country: sellerProfile.country,
    contactPreference: sellerProfile.contactPreference,
    socialLink: sellerProfile.socialLink,
    shortDescription: sellerProfile.shortDescription,
    status: parseSellerStatus(sellerProfile.status, sellerProfile.id),
    createdAt: sellerProfile.createdAt.toISOString(),
    updatedAt: sellerProfile.updatedAt.toISOString(),
  };
}
