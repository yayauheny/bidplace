import {
  publicMediaAssetSelect,
  mediaDeliverySelect,
  publicVariant,
  type PublicMediaAsset,
} from '../core/media/media.mapper';
import { sellerProfileResponseSchema } from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';

export const publicSellerProfileSelect = {
  id: true,
  slug: true,
  user: { select: { slug: true } },
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
      profilePhotoAsset: { select: publicMediaAssetSelect },
      directions: {
        orderBy: { position: 'asc' },
        select: {
          categoryId: true,
          category: {
            select: {
              id: true,
              slug: true,
              name: true,
              description: true,
              active: true,
            },
          },
        },
      },
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
          mediaAsset: { select: publicMediaAssetSelect },
        },
      },
    },
  },
} satisfies Prisma.SellerProfileSelect;

export type PublicSellerProfileRecord = Prisma.SellerProfileGetPayload<{
  select: typeof publicSellerProfileSelect;
}>;

export const sellerProfileResponseSelect = {
  mediaOperations: mediaDeliverySelect,
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
  user: { select: { slug: true } },
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
      directions: {
        orderBy: { position: 'asc' },
        select: {
          categoryId: true,
          category: {
            select: {
              id: true,
              slug: true,
              name: true,
              description: true,
              active: true,
            },
          },
        },
      },
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

export const sellerProfilePhotoSelect = {
  id: true,
  slug: true,
  userId: true,
  status: true,
  user: { select: { status: true } },
  profilePhotoObjectKey: true,
  profilePhotoAssetId: true,
} satisfies Prisma.SellerProfileSelect;

export function sellerProfilePhotoUrl(slug: string): string {
  return `/api/sellers/${slug}/photo`;
}

export function toPortfolioAchievement(
  achievement: {
    id: string;
    occurredAt: Date | null;
    occurredAtPrecision?: 'MONTH' | 'DAY' | null;
    body: string;
    mimeType: string | null;
    byteLength: number | null;
    checksum: string | null;
    objectKey: string | null;
    mediaAsset?: PublicMediaAsset | null;
  },
  visibility: 'private' | 'public' = 'private',
) {
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
            ...(visibility === 'public' && achievement.mediaAsset
              ? {
                  url:
                    publicVariant(achievement.mediaAsset, 'PREVIEW')?.url ??
                    (() => {
                      throw new Error('Published achievement is not delivered');
                    })(),
                }
              : {}),
          }
        : null,
  };
}

function selectedDirections(
  directions:
    | ReadonlyArray<{
        category: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          active: boolean;
        };
      }>
    | undefined,
) {
  return (directions ?? []).map((item) => {
    const description = item.category.description?.trim();
    return {
      id: item.category.id,
      slug: item.category.slug,
      name: item.category.name,
      description: description ? description : null,
      active: item.category.active,
    };
  });
}

export function toPublicSellerProfile(
  sellerProfile: Omit<PublicSellerProfileRecord, 'publishedRevision'> & {
    publishedRevision?: PublicSellerProfileRecord['publishedRevision'];
  },
) {
  if (!sellerProfile.shortDescription) {
    throw new Error('Published SellerProfile is missing required fields');
  }
  const directionCategoryIds =
    sellerProfile.publishedRevision?.directions?.map((item) => item.categoryId) ??
    [];
  const slug = sellerProfile.user?.slug ?? sellerProfile.slug;
  return {
    id: sellerProfile.id,
    slug,
    sellerType: sellerProfile.sellerType,
    discipline: sellerProfile.discipline,
    fullName: sellerProfile.fullName,
    profilePhotoUrl:
      publicVariant(
        sellerProfile.publishedRevision?.profilePhotoAsset,
        'PREVIEW',
      )?.url ?? sellerProfilePhotoUrl(slug),
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
    directionCategoryIds,
    directions: selectedDirections(sellerProfile.publishedRevision?.directions),
    achievements:
      sellerProfile.publishedRevision?.achievements.map((item) =>
        toPortfolioAchievement(item, 'public'),
      ) ?? [],
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
    mediaOperations,
    user,
    ...sellerProfileResponse
  } = sellerProfile as SellerProfileResponseRecord & {
    profilePhotoMimeType?: string | null;
    profilePhotoByteLength?: number | null;
    profilePhotoChecksum?: string | null;
    profilePhotoData?: Uint8Array | null;
    editingRevision?: SellerProfileOwnerRecord['editingRevision'] | null;
    user?: { slug: string | null } | null;
  };
  const accountSlug = user?.slug ?? sellerProfileResponse.slug;
  void _profilePhotoMimeType;
  void _profilePhotoByteLength;
  void _profilePhotoChecksum;
  void _profilePhotoData;

  const publicFields = editingRevision
    ? {
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
  const revisionOwnsFields = Boolean(editingRevision);

  return sellerProfileResponseSchema.parse({
    sellerProfile: {
      ...sellerProfileResponse,
      ...publicFields,
      slug: accountSlug,
      directionCategoryIds:
        editingRevision?.directions?.map((item) => item.categoryId) ?? [],
      directions: selectedDirections(editingRevision?.directions),
      applicationStage: sellerProfileResponse.applicationStage ?? null,
      city:
        (revisionOwnsFields
          ? publicFields.city
          : sellerProfileResponse.city
        )?.trim() || null,
      practice: revisionOwnsFields
        ? publicFields.practice
        : sellerProfileResponse.practice,
      biography: revisionOwnsFields
        ? publicFields.biography
        : sellerProfileResponse.biography,
      socialLink: revisionOwnsFields
        ? publicFields.socialLink
        : sellerProfileResponse.socialLink,
      telegramUrl: revisionOwnsFields
        ? publicFields.telegramUrl
        : sellerProfileResponse.telegramUrl,
      instagramUrl: revisionOwnsFields
        ? publicFields.instagramUrl
        : sellerProfileResponse.instagramUrl,
      websiteUrl: revisionOwnsFields
        ? publicFields.websiteUrl
        : sellerProfileResponse.websiteUrl,
      publicEmail: revisionOwnsFields
        ? (publicFields.publicEmail ?? null)
        : (sellerProfileResponse.publicEmail ?? null),
      profilePhotoUrl: sellerProfilePhotoUrl(accountSlug),
      createdAt: sellerProfile.createdAt.toISOString(),
      updatedAt: sellerProfile.updatedAt.toISOString(),
    },
    ...(mediaOperations?.[0] ? { publication: mediaOperations[0] } : {}),
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
