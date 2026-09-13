import { sellerProfileResponseSchema } from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';

export const publicSellerProfileSelect = {
  id: true,
  slug: true,
  sellerType: true,
  discipline: true,
  fullName: true,
  country: true,
  city: true,
  practice: true,
  socialLink: true,
  telegramUrl: true,
  instagramUrl: true,
  websiteUrl: true,
  shortDescription: true,
  publishedRevision: {
    select: {
      achievements: {
        orderBy: [{ occurredAt: 'desc' }, { position: 'asc' }],
        select: { id: true, occurredAt: true, body: true },
      },
    },
  },
} satisfies Prisma.SellerProfileSelect;

export type PublicSellerProfileRecord = Prisma.SellerProfileGetPayload<{
  select: typeof publicSellerProfileSelect;
}>;

export const sellerProfileResponseSelect = {
  id: true,
  userId: true,
  slug: true,
  fullName: true,
  sellerType: true,
  discipline: true,
  country: true,
  city: true,
  practice: true,
  socialLink: true,
  telegramUrl: true,
  instagramUrl: true,
  websiteUrl: true,
  shortDescription: true,
  handoffContactType: true,
  handoffContactValue: true,
  handoffInitiator: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SellerProfileSelect;

export type SellerProfileResponseRecord = Prisma.SellerProfileGetPayload<{
  select: typeof sellerProfileResponseSelect;
}>;

export const sellerProfileAuthSelect = {
  userId: true,
  status: true,
} satisfies Prisma.SellerProfileSelect;

export const sellerProfileHandoffSelect = {
  userId: true,
  status: true,
  handoffContactType: true,
  handoffContactValue: true,
  handoffInitiator: true,
} satisfies Prisma.SellerProfileSelect;

export const sellerProfilePhotoSelect = {
  id: true,
  slug: true,
  userId: true,
  status: true,
} satisfies Prisma.SellerProfileSelect;

export type SellerProfilePhotoRecord = Prisma.SellerProfileGetPayload<{
  select: typeof sellerProfilePhotoSelect;
}>;

export function sellerProfilePhotoUrl(slug: string): string {
  return `/api/sellers/${slug}/photo`;
}

export function toPublicSellerProfile(
  sellerProfile: Omit<PublicSellerProfileRecord, 'publishedRevision'> & {
    publishedRevision?: PublicSellerProfileRecord['publishedRevision'];
  },
) {
  return {
    id: sellerProfile.id,
    slug: sellerProfile.slug,
    sellerType: sellerProfile.sellerType,
    discipline: sellerProfile.discipline,
    fullName: sellerProfile.fullName,
    profilePhotoUrl: sellerProfilePhotoUrl(sellerProfile.slug),
    country: sellerProfile.country,
    city: sellerProfile.city ?? null,
    practice: sellerProfile.practice ?? null,
    socialLink: sellerProfile.socialLink ?? '',
    telegramUrl: sellerProfile.telegramUrl ?? null,
    instagramUrl: sellerProfile.instagramUrl ?? null,
    websiteUrl: sellerProfile.websiteUrl ?? null,
    shortDescription: sellerProfile.shortDescription,
    achievements:
      sellerProfile.publishedRevision?.achievements.map((achievement) => ({
        id: achievement.id,
        occurredAt: achievement.occurredAt?.toISOString() ?? null,
        body: achievement.body,
      })) ?? [],
  };
}

export function toSellerProfileResponse(
  sellerProfile: SellerProfileResponseRecord,
) {
  const {
    profilePhotoMimeType: _profilePhotoMimeType,
    profilePhotoByteLength: _profilePhotoByteLength,
    profilePhotoChecksum: _profilePhotoChecksum,
    profilePhotoData: _profilePhotoData,
    ...sellerProfileResponse
  } = sellerProfile as SellerProfileResponseRecord & {
    profilePhotoMimeType?: string | null;
    profilePhotoByteLength?: number | null;
    profilePhotoChecksum?: string | null;
    profilePhotoData?: Uint8Array | null;
  };
  void _profilePhotoMimeType;
  void _profilePhotoByteLength;
  void _profilePhotoChecksum;
  void _profilePhotoData;

  return sellerProfileResponseSchema.parse({
    sellerProfile: {
      ...sellerProfileResponse,
      city: sellerProfileResponse.city ?? null,
      practice: sellerProfileResponse.practice ?? null,
      socialLink: sellerProfileResponse.socialLink ?? '',
      telegramUrl: sellerProfileResponse.telegramUrl ?? null,
      instagramUrl: sellerProfileResponse.instagramUrl ?? null,
      websiteUrl: sellerProfileResponse.websiteUrl ?? null,
      profilePhotoUrl: sellerProfilePhotoUrl(sellerProfile.slug),
      createdAt: sellerProfile.createdAt.toISOString(),
      updatedAt: sellerProfile.updatedAt.toISOString(),
    },
  });
}
