import { productResponseSchema, type Product } from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';

import { publicSellerProfileSelect } from '../sellers/seller-profile.mapper';

export const productImageMetadataSelect = {
  id: true,
  position: true,
  mimeType: true,
  byteLength: true,
  checksum: true,
  width: true,
  height: true,
} satisfies Prisma.ProductImageSelect;

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
    images: product.images.map((image) => ({
      id: image.id,
      position: image.position,
      url: `/api/images/${image.id}`,
      mimeType: image.mimeType,
      byteLength: image.byteLength,
      checksum: image.checksum,
      width: image.width ?? null,
      height: image.height ?? null,
    })),
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
  createdAt: true,
  updatedAt: true,
  sellerProfile: { select: publicSellerProfileSelect },
  images: {
    orderBy: { position: 'asc' as const },
    select: productImageMetadataSelect,
  },
} satisfies Prisma.ProductSelect;

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
