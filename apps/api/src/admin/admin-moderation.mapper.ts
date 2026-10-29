import { PRODUCT_EDIT_LOCK_LISTING_STATUSES } from '../products/product-write-guard';
import { mediaDeliverySelect } from '../core/media/media.mapper';
import { type Prisma } from '@bidplace/database';

import { imageKey } from '../core/image-store/image-key';
import {
  catalogContentTerms,
  productRevisionImageSelect,
  projectedCatalogLabel,
  revisionSelectionSelect,
  revisionTermLabelSelect,
  selectedCategoryView,
  selectionFromRevision,
  toImageContracts,
  toRevisionGalleryImages,
} from '../products/products.mapper';
import { toPortfolioAchievement } from '../sellers/seller-profile.mapper';

const creationStepSelect = {
  id: true,
  position: true,
  title: true,
  body: true,
  mimeType: true,
  byteLength: true,
  checksum: true,
  width: true,
  height: true,
} satisfies Prisma.ProductCreationStepSelect;

const sellerPhotoMetaSelect = {
  profilePhotoMimeType: true,
  profilePhotoByteLength: true,
  profilePhotoChecksum: true,
  profilePhotoObjectKey: true,
} satisfies Prisma.SellerProfileSelect;

export const adminSellerRevisionSelect = {
  id: true,
  version: true,
  status: true,
  updatedAt: true,
  submittedAt: true,
  slug: true,
  fullName: true,
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
  ...sellerPhotoMetaSelect,
  achievements: {
    orderBy: { position: 'asc' },
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
  directions: {
    orderBy: { position: 'asc' },
    select: {
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
} satisfies Prisma.SellerProfileRevisionSelect;

export const adminSellerListSelect = {
  mediaOperations: mediaDeliverySelect,
  id: true,
  userId: true,
  status: true,
  updatedAt: true,
  sellerType: true,
  applicationStage: true,
  createdAt: true,
  slug: true,
  fullName: true,
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
  ...sellerPhotoMetaSelect,
  editingRevision: { select: adminSellerRevisionSelect },
} satisfies Prisma.SellerProfileSelect;

export const adminProductListSelect = {
  mediaOperations: mediaDeliverySelect,
  id: true,
  publicId: true,
  sellerProfileId: true,
  status: true,
  updatedAt: true,
  publishedAt: true,
  categoryId: true,
  title: true,
  story: true,
  technique: true,
  materials: true,
  dimensions: true,
  weight: true,
  year: true,
  condition: true,
  uniqueness: true,
  provenance: true,
  city: true,
  packaging: true,
  deliveryInfo: true,
  creationIntro: true,
  images: {
    orderBy: { position: 'asc' },
    select: {
      id: true,
      position: true,
      mimeType: true,
      byteLength: true,
      checksum: true,
      width: true,
      height: true,
    },
  },
  creationSteps: {
    orderBy: { position: 'asc' },
    select: creationStepSelect,
  },
  createdAt: true,
  publishedRevisionId: true,
  publishedRevision: { select: revisionTermLabelSelect },
  sellerProfile: { select: { slug: true, fullName: true, status: true } },
  listings: {
    where: { status: { in: [...PRODUCT_EDIT_LOCK_LISTING_STATUSES] } },
    select: { status: true },
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
  editingRevision: {
    select: {
      id: true,
      version: true,
      status: true,
      updatedAt: true,
      submittedAt: true,
      categoryId: true,
      title: true,
      story: true,
      technique: true,
      materials: true,
      dimensions: true,
      weight: true,
      year: true,
      condition: true,
      uniqueness: true,
      provenance: true,
      city: true,
      packaging: true,
      deliveryInfo: true,
      creationIntro: true,
      images: {
        orderBy: { position: 'asc' },
        select: productRevisionImageSelect,
      },
      storyToken: true,
      ...revisionSelectionSelect,
      storyBlocks: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          position: true,
          type: true,
          text: true,
          altText: true,
          mediaAssetId: true,
        },
      },
    },
  },
} satisfies Prisma.ProductSelect;

export type AdminSellerListRecord = Prisma.SellerProfileGetPayload<{
  select: typeof adminSellerListSelect;
}>;
export type AdminProductListRecord = Prisma.ProductGetPayload<{
  select: typeof adminProductListSelect;
}>;

type PhotoMeta = {
  profilePhotoMimeType?: string | null;
  profilePhotoByteLength?: number | null;
  profilePhotoChecksum?: string | null;
  profilePhotoObjectKey?: string | null;
};

export type SellerRevisionPhotoSource = {
  objectKey: string;
  mimeType: string;
  byteLength: number;
  checksum: string;
};

function completePhoto(photo: PhotoMeta): SellerRevisionPhotoSource | null {
  if (
    !photo.profilePhotoMimeType ||
    !photo.profilePhotoByteLength ||
    photo.profilePhotoByteLength <= 0 ||
    !photo.profilePhotoChecksum ||
    !photo.profilePhotoObjectKey
  ) {
    return null;
  }
  return {
    objectKey: photo.profilePhotoObjectKey,
    mimeType: photo.profilePhotoMimeType,
    byteLength: photo.profilePhotoByteLength,
    checksum: photo.profilePhotoChecksum,
  };
}

export function selectSellerRevisionPhotoSource(
  revision: PhotoMeta,
  parent: PhotoMeta & { id: string },
): SellerRevisionPhotoSource | null {
  const revisionPhoto = completePhoto(revision);
  if (revisionPhoto) return revisionPhoto;
  const parentPhoto = completePhoto({
    ...parent,
    profilePhotoObjectKey:
      parent.profilePhotoObjectKey ?? imageKey.sellerPhoto(parent.id),
  });
  return parentPhoto;
}

function nullableText(value: string | null | undefined) {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function sellerContent(record: {
  slug: string;
  fullName: string;
  discipline: string | null;
  country: string;
  city: string | null;
  practice: string | null;
  biography: string | null;
  socialLink: string | null;
  telegramUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  publicEmail: string | null;
  shortDescription: string | null;
}) {
  return {
    slug: record.slug,
    fullName: record.fullName,
    discipline: nullableText(record.discipline),
    country: record.country.trim(),
    city: nullableText(record.city),
    practice: nullableText(record.practice),
    biography: nullableText(record.biography),
    socialLink: nullableText(record.socialLink),
    telegramUrl: nullableText(record.telegramUrl),
    instagramUrl: nullableText(record.instagramUrl),
    websiteUrl: nullableText(record.websiteUrl),
    publicEmail: nullableText(record.publicEmail),
    shortDescription: nullableText(record.shortDescription),
  };
}

function creationSteps(steps: AdminProductListRecord['creationSteps']) {
  return steps.map((step) => ({
    id: step.id,
    position: step.position,
    title: step.title,
    body: step.body,
    image:
      step.mimeType && step.byteLength && step.checksum
        ? {
            url: `/api/creation-steps/${step.id}/image`,
            mimeType: step.mimeType,
            byteLength: step.byteLength,
            checksum: step.checksum,
            width: step.width,
            height: step.height,
          }
        : null,
  }));
}

function productContent(
  record: {
    categoryId: string | null;
    title: string | null;
    story: string | null;
    dimensions: string | null;
    weight: string | null;
    year: number | null;
    condition: string | null;
    uniqueness: string | null;
    provenance: string | null;
    city: string | null;
    packaging: string | null;
    deliveryInfo: string | null;
    creationIntro: string | null;
    images: Parameters<typeof toImageContracts>[0];
  },
  terms: Parameters<typeof projectedCatalogLabel>[0],
) {
  return {
    categoryId: record.categoryId,
    title: nullableText(record.title),
    story: nullableText(record.story),
    technique: projectedCatalogLabel(terms, 'TECHNIQUE'),
    materials: projectedCatalogLabel(terms, 'MATERIAL'),
    dimensions: nullableText(record.dimensions),
    weight: nullableText(record.weight),
    year: record.year,
    condition: nullableText(record.condition),
    uniqueness: nullableText(record.uniqueness),
    provenance: nullableText(record.provenance),
    city: nullableText(record.city),
    packaging: nullableText(record.packaging),
    deliveryInfo: nullableText(record.deliveryInfo),
    creationIntro: nullableText(record.creationIntro),
    images: toImageContracts(record.images),
  };
}

export function toAdminSellerProfile(
  seller: AdminSellerListRecord,
  lastModerationReason: string | null,
  hasBlockingListing: boolean,
  revisionPhotoOnly = false,
) {
  const revision = seller.editingRevision;
  const photo = revision
    ? revisionPhotoOnly
      ? completePhoto(revision)
      : selectSellerRevisionPhotoSource(revision, seller)
    : null;
  return {
    ...(seller.mediaOperations?.[0]
      ? { publication: seller.mediaOperations[0] }
      : {}),
    id: seller.id,
    userId: seller.userId,
    parentStatus: seller.status,
    parentUpdatedAt: seller.updatedAt.toISOString(),
    sellerType: seller.sellerType,
    applicationStage: seller.applicationStage,
    createdAt: seller.createdAt.toISOString(),
    parent: sellerContent(seller),
    reviewTarget: revision
      ? {
          id: revision.id,
          version: revision.version,
          status: revision.status,
          updatedAt: revision.updatedAt.toISOString(),
          submittedAt: revision.submittedAt?.toISOString() ?? null,
          content: {
            ...sellerContent(revision),
            profilePhoto: photo
              ? {
                  url: `/api/admin/seller-profiles/${seller.id}/revisions/${revision.id}/photo`,
                  mimeType: photo.mimeType,
                  byteLength: photo.byteLength,
                  checksum: photo.checksum,
                }
              : null,
            achievements: revision.achievements.map((item) =>
              toPortfolioAchievement(item),
            ),
            directions: (revision.directions ?? []).flatMap((item) => {
              const category = selectedCategoryView(item.category);
              return category ? [category] : [];
            }),
          },
        }
      : null,
    lastModerationReason,
    hasBlockingListing,
  };
}

export function toAdminProduct(
  product: AdminProductListRecord,
  lastModerationReason: string | null,
) {
  const revision = product.editingRevision;
  const revisionImages = toRevisionGalleryImages(revision);
  return {
    ...(product.mediaOperations?.[0]
      ? { publication: product.mediaOperations[0] }
      : {}),
    id: product.id,
    publicId: product.publicId,
    sellerProfileId: product.sellerProfileId,
    parentStatus: product.status,
    parentUpdatedAt: product.updatedAt.toISOString(),
    publishedAt: product.publishedAt?.toISOString() ?? null,
    sellerProfile: product.sellerProfile,
    parent: productContent(product, catalogContentTerms(product)),
    creationSteps: creationSteps(product.creationSteps),
    reviewTarget: revision
      ? {
          id: revision.id,
          version: revision.version,
          status: revision.status,
          updatedAt: revision.updatedAt.toISOString(),
          submittedAt: revision.submittedAt?.toISOString() ?? null,
          content: productContent(
            {
              ...revision,
              images: revisionImages ?? [],
            },
            revision.terms,
          ),
          story: {
            storyToken: revision.storyToken,
            blocks: revision.storyBlocks.map((block) => ({
              id: block.id,
              position: block.position,
              type: block.type,
              ...(block.type === 'IMAGE'
                ? { mediaAssetId: block.mediaAssetId, altText: block.altText }
                : { text: block.text }),
            })),
          },
          selection: selectionFromRevision(revision),
        }
      : null,
    hasBlockingListing: product.listings.length > 0,
    lastModerationReason,
  };
}

const summaryPhotoSelect = {
  mediaOperations: mediaDeliverySelect,
  id: true,
  publishedRevisionId: true,
  status: true,
  ...sellerPhotoMetaSelect,
  editingRevision: {
    select: { id: true, updatedAt: true, ...sellerPhotoMetaSelect },
  },
} satisfies Prisma.SellerProfileSelect;

export const adminSellerSummarySelect = summaryPhotoSelect;
export const adminProductSummarySelect = {
  id: true,
  status: true,
  publishedRevisionId: true,
  sellerProfile: { select: { fullName: true, slug: true } },
  images: {
    take: 1,
    orderBy: { position: 'asc' as const },
    select: { id: true, checksum: true },
  },
  editingRevision: {
    select: {
      images: {
        take: 1,
        orderBy: { position: 'asc' as const },
        select: { image: { select: { id: true, checksum: true } } },
      },
    },
  },
  mediaOperations: mediaDeliverySelect,
} satisfies Prisma.ProductSelect;

function summaryReviewKind(record: {
  publishedRevisionId: string | null;
  status: string;
}) {
  return record.publishedRevisionId
    ? ('repeat' as const)
    : record.status === 'PENDING_REVIEW'
      ? ('first' as const)
      : ('unknown' as const);
}

export function toSellerSummaryCard(
  record: Prisma.SellerProfileGetPayload<{
    select: typeof adminSellerSummarySelect;
  }>,
) {
  const revision = record.editingRevision;
  const photo = revision
    ? selectSellerRevisionPhotoSource(revision, record)
    : null;
  return {
    author: null,
    reviewKind: summaryReviewKind(record),
    ...(record.mediaOperations[0] ? { publication: record.mediaOperations[0] } : {}),
    thumbnail:
      revision && photo
        ? {
            kind: 'seller-photo' as const,
            revisionId: revision.id,
            updatedAt: revision.updatedAt.toISOString(),
            checksum: photo.checksum,
          }
        : null,
  };
}

export function toProductSummaryCard(
  record: Prisma.ProductGetPayload<{
    select: typeof adminProductSummarySelect;
  }>,
) {
  const image = record.editingRevision
    ? record.editingRevision.images[0]?.image
    : record.images[0];
  return {
    author: record.sellerProfile,
    reviewKind: summaryReviewKind(record),
    thumbnail: image
      ? {
          kind: 'product-image' as const,
          id: image.id,
          checksum: image.checksum,
        }
      : null,
    ...(record.mediaOperations[0]
      ? { publication: record.mediaOperations[0] }
      : {}),
  };
}
