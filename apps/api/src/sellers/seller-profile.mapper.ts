import { type SellerProfile } from '@bidplace/contracts';

import {
  parseSellerStatus,
  parseSellerType,
} from '../core/contracts';

export type RawSellerProfileRecord = {
  id: string;
  userId: string;
  slug: string;
  sellerType: string;
  storeName: string;
  country: string;
  contactPreference: string;
  socialLink: string | null;
  shortDescription: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export function toContractSellerProfile(
  sellerProfile: RawSellerProfileRecord,
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
