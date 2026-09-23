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
  biography: true,
  socialLink: true,
  telegramUrl: true,
  instagramUrl: true,
  websiteUrl: true,
  publicEmail: true,
  shortDescription: true,
  publishedRevision: {
    select: {
      achievements: {
        orderBy: [
          { occurredAt: { sort: 'desc', nulls: 'last' } },
          { position: 'asc' },
        ],
        select: {
          id: true,
          occurredAt: true,
          occurredAtPrecision: true,
          body: true,
          mimeType: true,
          byteLength: true,
          checksum: true,
          objectKey: true,
        },
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
  biography: true,
  socialLink: true,
  telegramUrl: true,
  instagramUrl: true,
  websiteUrl: true,
  publicEmail: true,
  shortDescription: true,
  handoffContactType: true,
  handoffContactValue: true,
  handoffInitiator: true,
  status: true,
  applicationStage: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SellerProfileSelect;

export const sellerProfileOwnerSelect = {
  ...sellerProfileResponseSelect,
  editingRevision: {
    select: {
      id: true,
      version: true,
      status: true,
      updatedAt: true,
      slug: true,
      discipline: true,
      fullName: true,
      country: true,
      city: true,
      practice: true,
      biography: true,
      socialLink: true,
      telegramUrl: true,
      instagramUrl: true,
      websiteUrl: true,
      publicEmail: true,
      shortDescription: true,
    },
  },
} satisfies Prisma.SellerProfileSelect;

export type SellerProfileResponseRecord = Prisma.SellerProfileGetPayload<{
  select: typeof sellerProfileResponseSelect;
}>;

export type SellerProfileOwnerRecord = Prisma.SellerProfileGetPayload<{
  select: typeof sellerProfileOwnerSelect;
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
  profilePhotoObjectKey: true,
} satisfies Prisma.SellerProfileSelect;

export type SellerProfilePhotoRecord = Prisma.SellerProfileGetPayload<{
  select: typeof sellerProfilePhotoSelect;
}>;

export function sellerProfilePhotoUrl(slug: string): string {
  return `/api/sellers/${slug}/photo`;
}

export function toPortfolioAchievement(achievement: {
  id: string;
  occurredAt: Date | null;
  occurredAtPrecision?: 'MONTH' | 'DAY' | null;
  body: string;
  mimeType: string | null;
  byteLength: number | null;
  checksum: string | null;
  objectKey: string | null;
}) {
  return {
    id: achievement.id,
    occurredDate: achievement.occurredAt
      ? {
          year: achievement.occurredAt.getUTCFullYear(),
          month: achievement.occurredAt.getUTCMonth() + 1,
          day:
            achievement.occurredAtPrecision === 'MONTH'
              ? null
              : achievement.occurredAt.getUTCDate(),
        }
      : null,
    body: achievement.body,
    image:
      achievement.mimeType &&
      achievement.byteLength &&
      achievement.checksum &&
      achievement.objectKey
        ? {
            url: `/api/author-achievements/${achievement.id}/image`,
            mimeType: achievement.mimeType,
            byteLength: achievement.byteLength,
            checksum: achievement.checksum,
          }
        : null,
  };
}

export function toPublicSellerProfile(
  sellerProfile: Omit<PublicSellerProfileRecord, 'publishedRevision'> & {
    publishedRevision?: PublicSellerProfileRecord['publishedRevision'];
  },
) {
  if (!sellerProfile.discipline || !sellerProfile.shortDescription) {
    throw new Error('Published SellerProfile is missing required fields');
  }
  return {
    id: sellerProfile.id,
    slug: sellerProfile.slug,
    sellerType: sellerProfile.sellerType,
    discipline: sellerProfile.discipline,
    fullName: sellerProfile.fullName,
    profilePhotoUrl: sellerProfilePhotoUrl(sellerProfile.slug),
    country: sellerProfile.country,
    city: sellerProfile.city?.trim() || null,
    practice: sellerProfile.practice ?? null,
    biography: sellerProfile.biography ?? null,
    socialLink: sellerProfile.socialLink ?? null,
    telegramUrl: sellerProfile.telegramUrl ?? null,
    instagramUrl: sellerProfile.instagramUrl ?? null,
    websiteUrl: sellerProfile.websiteUrl ?? null,
    publicEmail: sellerProfile.publicEmail ?? null,
    shortDescription: sellerProfile.shortDescription,
    achievements:
      sellerProfile.publishedRevision?.achievements.map(toPortfolioAchievement) ??
      [],
  };
}

export function toSellerProfileResponse(
  sellerProfile: SellerProfileResponseRecord & {
    editingRevision?: SellerProfileOwnerRecord['editingRevision'] | null;
  },
) {
  const {
    profilePhotoMimeType: _profilePhotoMimeType,
    profilePhotoByteLength: _profilePhotoByteLength,
    profilePhotoChecksum: _profilePhotoChecksum,
    profilePhotoData: _profilePhotoData,
    editingRevision,
    ...sellerProfileResponse
  } = sellerProfile as SellerProfileResponseRecord & {
    profilePhotoMimeType?: string | null;
    profilePhotoByteLength?: number | null;
    profilePhotoChecksum?: string | null;
    profilePhotoData?: Uint8Array | null;
    editingRevision?: SellerProfileOwnerRecord['editingRevision'] | null;
  };
  void _profilePhotoMimeType;
  void _profilePhotoByteLength;
  void _profilePhotoChecksum;
  void _profilePhotoData;

  const publicFields = editingRevision
    ? {
        slug: editingRevision.slug,
        discipline: editingRevision.discipline,
        fullName: editingRevision.fullName,
        country: editingRevision.country,
        city: editingRevision.city,
        practice: editingRevision.practice,
        biography: editingRevision.biography,
        socialLink: editingRevision.socialLink ?? null,
        telegramUrl: editingRevision.telegramUrl,
        instagramUrl: editingRevision.instagramUrl,
        websiteUrl: editingRevision.websiteUrl,
        publicEmail: editingRevision.publicEmail,
        shortDescription: editingRevision.shortDescription,
      }
    : {};

  return sellerProfileResponseSchema.parse({
    sellerProfile: {
      ...sellerProfileResponse,
      ...publicFields,
      city:
        (publicFields.city ?? sellerProfileResponse.city)?.trim() || null,
      practice: (publicFields.practice ?? sellerProfileResponse.practice) ?? null,
      biography:
        (publicFields.biography ?? sellerProfileResponse.biography) ?? null,
      telegramUrl:
        (publicFields.telegramUrl ?? sellerProfileResponse.telegramUrl) ?? null,
      instagramUrl:
        (publicFields.instagramUrl ?? sellerProfileResponse.instagramUrl) ??
        null,
      websiteUrl:
        (publicFields.websiteUrl ?? sellerProfileResponse.websiteUrl) ?? null,
      publicEmail:
        (publicFields.publicEmail ?? sellerProfileResponse.publicEmail) ?? null,
      profilePhotoUrl: sellerProfilePhotoUrl(sellerProfile.slug),
      createdAt: sellerProfile.createdAt.toISOString(),
      updatedAt: sellerProfile.updatedAt.toISOString(),
    },
    editingRevision: editingRevision
      ? {
          id: editingRevision.id,
          version: editingRevision.version,
          status: editingRevision.status,
          updatedAt: editingRevision.updatedAt.toISOString(),
        }
      : null,
  });
}
