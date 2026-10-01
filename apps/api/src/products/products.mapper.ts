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
  uniqueness: true,
  images: {
    orderBy: { position: 'asc' as const },
    select: productRevisionImageSelect,
  },
} satisfies Prisma.ProductRevisionSelect;

export const productRevisionOwnerSelect = {
  id: true,
  version: true,
  status: true,
  updatedAt: true,
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

export function toRevisionGalleryImages(
  revision: RevisionGallery | null | undefined,
) {
  if (!revision) return null;
  return revision.images.map(({ position, image }) => ({
    ...image,
    position,
  }));
}

export function toContractProduct(product: ProductRecord): Product {
  return {
    id: product.id,
    publicId: product.publicId,
    sellerProfileId: product.sellerProfileId,
    categoryId: product.categoryId ?? null,
    title: product.title ?? null,
    story: product.story ?? null,
    technique: product.technique ?? null,
    materials: product.materials ?? null,
    dimensions: product.dimensions ?? null,
    weight: product.weight ?? null,
    year: product.year ?? null,
    condition: product.condition ?? null,
    uniqueness: product.uniqueness ?? null,
    provenance: product.provenance ?? null,
    city: product.city ?? null,
    packaging: product.packaging ?? null,
    deliveryInfo: product.deliveryInfo ?? null,
    publishedAt: product.publishedAt?.toISOString() ?? null,
    status: product.status,
    images: toImageContracts(product.images),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export type ProductRevisionOwnerRecord = Prisma.ProductRevisionGetPayload<{
  select: typeof productRevisionOwnerSelect;
}>;

export function toOwnerContractProduct(
  product: ProductRecord,
  editingRevision: ProductRevisionOwnerRecord | null | undefined,
): Product {
  const base = toContractProduct(product);
  if (!editingRevision) return base;
  const editingImages = toRevisionGalleryImages(editingRevision);
  return {
    ...base,
    categoryId: editingRevision.categoryId ?? null,
    title: editingRevision.title ?? null,
    story: editingRevision.story ?? null,
    technique: editingRevision.technique ?? null,
    materials: editingRevision.materials ?? null,
    dimensions: editingRevision.dimensions ?? null,
    weight: editingRevision.weight ?? null,
    year: editingRevision.year ?? null,
    condition: editingRevision.condition ?? null,
    uniqueness: editingRevision.uniqueness ?? null,
    provenance: editingRevision.provenance ?? null,
    city: editingRevision.city ?? null,
    packaging: editingRevision.packaging ?? null,
    deliveryInfo: editingRevision.deliveryInfo ?? null,
    images: editingImages ? toImageContracts(editingImages) : base.images,
  };
}

export function toProductResponse(product: ProductRecord) {
  return productResponseSchema.parse({ product: toContractProduct(product) });
}

export const portfolioCatalogProductSelect = {
  id: true,
  publicId: true,
  publishedAt: true,
  sellerProfile: { select: publicSellerProfileSelect },
  publishedRevision: { select: productRevisionGallerySelect },
} satisfies Prisma.ProductSelect;

export type PortfolioCatalogProductRecord = Prisma.ProductGetPayload<{
  select: typeof portfolioCatalogProductSelect;
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
