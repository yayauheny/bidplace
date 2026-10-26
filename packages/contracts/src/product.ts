import { publicMediaUrlSchema, mediaDeliverySchema } from './media';
import { z } from 'zod';

import { workSelectionSchema } from './catalog';

import { type ProductStatus, productStatusSchema } from './enums';
import { isoDateTimeSchema, uuidSchema } from './primitives';

export const EDITABLE_PRODUCT_STATUSES = [
  'DRAFT',
  'CHANGES_REQUESTED',
  'REJECTED',
] as const satisfies readonly ProductStatus[];

export function isEditableProductStatus(
  status: ProductStatus,
): status is (typeof EDITABLE_PRODUCT_STATUSES)[number] {
  return (EDITABLE_PRODUCT_STATUSES as readonly ProductStatus[]).includes(
    status,
  );
}

const optionalText = z.string().trim().min(1).nullable();

export const photoCropSchema = z
  .object({
    x: z.number().finite().min(0).max(1),
    y: z.number().finite().min(0).max(1),
    width: z.number().finite().positive().max(1),
    height: z.number().finite().positive().max(1),
  })
  .strict()
  .refine(
    (crop) => crop.x + crop.width <= 1 && crop.y + crop.height <= 1,
    'Crop must fit the transformed full image',
  );
export type PhotoCrop = z.infer<typeof photoCropSchema>;

export const workPhotoResultSchema = z
  .object({
    revisionId: uuidSchema,
    slotId: uuidSchema,
    imageId: uuidSchema,
    version: z.number().int().nonnegative(),
    crop: photoCropSchema.nullable(),
  })
  .strict();
export type WorkPhotoResult = z.infer<typeof workPhotoResultSchema>;
export const workPhotoUploadResponseSchema = z
  .object({
    ok: z.literal(true),
    photos: z.array(workPhotoResultSchema).nonempty().max(10),
  })
  .strict();
export const workPhotoEditRequestSchema = z
  .object({
    revisionId: uuidSchema,
    version: z.number().int().nonnegative(),
    crop: photoCropSchema.nullable(),
    operationKey: z.string().regex(/^[a-zA-Z0-9:_-]{1,100}$/),
  })
  .strict();
export type WorkPhotoEditRequest = z.infer<typeof workPhotoEditRequestSchema>;

export const productImageSchema = z
  .object({
    id: uuidSchema,
    slotId: uuidSchema.optional(),
    slotVersion: z.number().int().nonnegative().optional(),
    crop: photoCropSchema.nullable().optional(),
    mediaAssetId: uuidSchema.nullable().optional(),
    position: z.number().int().nonnegative(),
    full: z
      .object({
        url: publicMediaUrlSchema,
        mimeType: z.string(),
        byteLength: z.number().int().positive(),
        checksum: z.string().length(64),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
      })
      .strict()
      .optional(),
    url: z.union([
      z.string().regex(/^\/api\/images\/[0-9a-f-]+$/),
      publicMediaUrlSchema,
    ]),
    mimeType: z.string(),
    byteLength: z.number().int().positive(),
    checksum: z.string().length(64),
    width: z.number().int().positive().nullable(),
    height: z.number().int().positive().nullable(),
  })
  .strict();

export const creationStepImageSchema = z
  .object({
    url: z.union([
      z.string().regex(/^\/api\/creation-steps\/[0-9a-f-]+\/image$/),
      publicMediaUrlSchema,
    ]),
    mimeType: z.string(),
    byteLength: z.number().int().positive(),
    checksum: z.string().length(64),
    width: z.number().int().positive().nullable(),
    height: z.number().int().positive().nullable(),
  })
  .strict();

export const creationStepSchema = z
  .object({
    id: uuidSchema,
    position: z.number().int().nonnegative(),
    title: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(5000),
    image: creationStepImageSchema.nullable(),
  })
  .strict();

export const productImageOrderRequestSchema = z
  .object({
    imageIds: z.array(uuidSchema).min(1).max(10),
    revisionId: uuidSchema.optional(),
  })
  .strict();

export const productSchema = z
  .object({
    id: uuidSchema,
    publicId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
    sellerProfileId: uuidSchema,
    categoryId: uuidSchema.nullable(),
    title: optionalText,
    story: optionalText,
    technique: optionalText,
    materials: optionalText,
    dimensions: optionalText,
    weight: optionalText,
    year: z.number().int().nullable(),
    condition: optionalText,
    uniqueness: optionalText,
    provenance: optionalText,
    city: optionalText,
    packaging: optionalText,
    deliveryInfo: optionalText,
    publishedAt: isoDateTimeSchema.nullable(),
    status: productStatusSchema,
    images: z.array(productImageSchema),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const productWriteRequestSchema = z
  .object({
    categoryId: uuidSchema.nullable().optional(),
    title: z.string().trim().min(1).nullable().optional(),
    story: z.string().trim().min(1).nullable().optional(),
    dimensions: z.string().trim().min(1).nullable().optional(),
    weight: z.string().trim().min(1).nullable().optional(),
    year: z
      .number()
      .int()
      .min(0, 'Введите год числом от 0 до 9999')
      .max(9999, 'Введите год числом от 0 до 9999')
      .nullable()
      .optional(),
    condition: z.string().trim().min(1).nullable().optional(),
    uniqueness: z.string().trim().min(1).nullable().optional(),
    provenance: z.string().trim().min(1).nullable().optional(),
    city: z.string().trim().min(1).nullable().optional(),
    packaging: z.string().trim().min(1).nullable().optional(),
    deliveryInfo: z.string().trim().min(1).nullable().optional(),
    creationIntro: z.string().trim().min(1).max(5000).nullable().optional(),
  })
  .merge(workSelectionSchema)
  .strict();

export const creationStepWriteSchema = z
  .object({
    id: uuidSchema.optional(),
    position: z.number().int().nonnegative().optional(),
    title: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(5000),
  })
  .strict();

export const creationStoryWriteRequestSchema = z
  .object({
    intro: z.string().trim().min(1).max(5000).nullable(),
    steps: z.array(creationStepWriteSchema).max(20),
  })
  .strict();

export const creationStorySchema = z
  .object({
    intro: z.string().trim().min(1).nullable(),
    steps: z.array(creationStepSchema),
  })
  .strict();

export const creationStoryResponseSchema = z
  .object({ creation: creationStorySchema })
  .strict();

export const creationStepOrderRequestSchema = z
  .object({ stepIds: z.array(uuidSchema).max(20) })
  .strict();

export const productResponseSchema = z
  .object({
    publication: mediaDeliverySchema.optional(),
    product: productSchema,
  })
  .strict();

export type Product = z.infer<typeof productSchema>;
export type ProductWriteRequest = z.infer<typeof productWriteRequestSchema>;
export type CreationStep = z.infer<typeof creationStepSchema>;
export type CreationStoryWriteRequest = z.infer<
  typeof creationStoryWriteRequestSchema
>;
