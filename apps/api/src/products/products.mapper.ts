import { productResponseSchema, type Product } from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';

import { publicSellerProfileSelect } from '../sellers/seller-profile.mapper';

export const productImageBlobSelect = {
  id: true,
  mimeType: true,
  byteLength: true,
  checksum: true,
  width: true,
  height: true,
} satisfies Prisma.ProductImageSelect;

export const productImageMetadataSelect = {
  ...productImageBlobSelect,
  position: true,
} satisfies Prisma.ProductImageSelect;

export const productRevisionImageSelect = {
  position: true,
  image: { select: productImageBlobSelect },
} satisfies Prisma.ProductRevisionImageSelect;

export const productRevisionGallerySelect = {
  title: true,
  story: true,
  categoryId: true,
  technique: true,
  materials: true,
  dimensions: true,
  year: true,
  images: {
    orderBy: { position: 'asc' as const },
    select: productRevisionImageSelect,
  },
} satisfies Prisma.ProductRevisionSelect;

export const productSelect = {
  id: true,
  publicId: true,
  sellerProfileId: true,
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
  publishedAt: true,
  status: true,
  editingRevisionId: true,
  publishedRevisionId: true,
  createdAt: true,
  updatedAt: true,
  editingRevision: {
    select: {
      ...productRevisionGallerySelect,
      weight: true,
      condition: true,
      uniqueness: true,
      provenance: true,
      city: true,
      packaging: true,
      deliveryInfo: true,
    },
  },
  images: {
    select: productImageMetadataSelect,
    orderBy: { position: 'asc' },
  },
} satisfies Prisma.ProductSelect;

export type ProductRecord = Prisma.ProductGetPayload<{
  select: typeof productSelect;
}>;

type GalleryImage = {
  id: string;
  position: number;
  mimeType: string;
  byteLength: number;
  checksum: string;
  width: number | null;
  height: number | null;
};

type RevisionGallery = {
  images: Array<{
    position: number;
    image: Omit<GalleryImage, 'position'>;
  }>;
};

export function toImageContracts(images: readonly GalleryImage[]) {
  return images.map((image) => ({
    id: image.id,
    position: image.position,
    url: `/api/images/${image.id}`,
    mimeType: image.mimeType,
    byteLength: image.byteLength,
    checksum: image.checksum,
    width: image.width ?? null,
    height: image.height ?? null,
  }));
}

export function toRevisionGalleryImages(revision: RevisionGallery | null | undefined) {
  if (!revision) return null;
  return revision.images.map(({ position, image }) => ({
    ...image,
    position,
  }));
}

export function toContractProduct(product: ProductRecord): Product {
  const editing = product.editingRevision;
  const revisionImages = toRevisionGalleryImages(editing);
  return {
    id: product.id,
    publicId: product.publicId,
    sellerProfileId: product.sellerProfileId,
    categoryId: (editing?.categoryId ?? product.categoryId) ?? null,
    title: (editing ? editing.title : product.title) ?? null,
    story: (editing ? editing.story : product.story) ?? null,
    technique: (editing ? editing.technique : product.technique) ?? null,
    materials: (editing ? editing.materials : product.materials) ?? null,
    dimensions: (editing ? editing.dimensions : product.dimensions) ?? null,
    weight: (editing ? editing.weight : product.weight) ?? null,
    year: (editing ? editing.year : product.year) ?? null,
    condition: (editing ? editing.condition : product.condition) ?? null,
    uniqueness: (editing ? editing.uniqueness : product.uniqueness) ?? null,
    provenance: (editing ? editing.provenance : product.provenance) ?? null,
    city: (editing ? editing.city : product.city) ?? null,
    packaging: (editing ? editing.packaging : product.packaging) ?? null,
    deliveryInfo: (editing ? editing.deliveryInfo : product.deliveryInfo) ?? null,
    publishedAt: product.publishedAt?.toISOString() ?? null,
    status: product.status,
    images: toImageContracts(revisionImages ?? product.images),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function toProductResponse(product: ProductRecord) {
  return productResponseSchema.parse({ product: toContractProduct(product) });
}

export const publicCatalogProductSelect = {
  id: true,
  publicId: true,
  sellerProfileId: true,
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
  publishedAt: true,
  status: true,
  editingRevisionId: true,
  publishedRevisionId: true,
  createdAt: true,
  updatedAt: true,
  sellerProfile: { select: publicSellerProfileSelect },
  publishedRevision: { select: productRevisionGallerySelect },
  images: {
    orderBy: { position: 'asc' as const },
    select: productImageMetadataSelect,
  },
} satisfies Prisma.ProductSelect;

export type PublicCatalogProductRecord = Prisma.ProductGetPayload<{
  select: typeof publicCatalogProductSelect;
}>;

export function toCreationStepContract(step: {
  id: string;
  position: number;
  title: string;
  body: string;
  mimeType: string | null;
  byteLength: number | null;
  checksum: string | null;
  width: number | null;
  height: number | null;
}) {
  return {
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
  };
}
