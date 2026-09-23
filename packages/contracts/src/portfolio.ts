import { z } from 'zod';

import { paginationMetaSchema, paginationQuerySchema } from './pagination';
import { productImageSchema } from './product';
import {
  authorApplicationStageSchema,
  productStatusSchema,
  sellerProfileRevisionStatusSchema,
  sellerStatusSchema,
} from './enums';
import { isoDateTimeSchema, slugSchema, uuidSchema } from './primitives';

const publicText = z.string().trim().min(1);

export const portfolioAchievementImageSchema = z
  .object({
    url: z.string().regex(/^\/api\/author-achievements\/[0-9a-f-]+\/image$/),
    mimeType: publicText,
    byteLength: z.number().int().positive(),
    checksum: z.string().length(64),
  })
  .strict();

export const portfolioAchievementSchema = z
  .object({
    id: uuidSchema,
    occurredDate: z
      .object({
        year: z.number().int().min(1).max(9_999),
        month: z.number().int().min(1).max(12),
        day: z.number().int().min(1).max(31).nullable(),
      })
      .strict()
      .superRefine((value, context) => {
        if (value.day === null) return;
        const date = new Date(Date.UTC(value.year, value.month, 0));
        if (value.day > date.getUTCDate()) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['day'],
            message: 'Achievement day must be valid for its month and year',
          });
        }
      })
      .nullable(),
    body: publicText,
    image: portfolioAchievementImageSchema.nullable(),
  })
  .strict();

export const portfolioWorkSchema = z
  .object({
    id: uuidSchema,
    publicId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
    title: publicText,
    story: publicText.nullable(),
    categoryId: uuidSchema,
    technique: publicText.nullable(),
    materials: publicText.nullable(),
    dimensions: publicText.nullable(),
    year: z.number().int().nullable(),
    uniqueness: z.string().trim().min(1).nullable(),
    images: z.array(productImageSchema).nonempty(),
    publishedAt: z.string().datetime(),
    sharePath: z.string().regex(/^\/works\/[A-Za-z0-9_-]{11}$/),
  })
  .strict();

export const portfolioAuthorSchema = z
  .object({
    id: uuidSchema,
    slug: slugSchema,
    fullName: publicText,
    country: publicText,
    city: publicText,
    discipline: publicText,
    practice: z.string().trim().min(1).nullable(),
    biography: z.string().trim().min(1).nullable(),
    profilePhotoUrl: z
      .string()
      .regex(/^\/api\/sellers\/[A-Za-z0-9_-]+\/photo$/),
    telegramUrl: z.string().url().nullable(),
    instagramUrl: z.string().url().nullable(),
    websiteUrl: z.string().url().nullable(),
    publicEmail: z.string().email().nullable().optional(),
    shortDescription: publicText,
    achievements: z.array(portfolioAchievementSchema),
    sharePath: z.string().regex(/^\/authors\/[a-z0-9]+(?:[-_][a-z0-9]+)*$/),
  })
  .strict();

export const portfolioWorkListItemSchema = z
  .object({ work: portfolioWorkSchema, author: portfolioAuthorSchema })
  .strict();

export const portfolioWorkDetailResponseSchema = z
  .object({
    work: portfolioWorkSchema,
    author: portfolioAuthorSchema,
    relatedWorks: z.array(portfolioWorkListItemSchema),
  })
  .strict();

export const portfolioWorksQuerySchema = paginationQuerySchema
  .extend({
    q: z.string().trim().min(1).max(120).optional(),
    category: uuidSchema.optional(),
    author: z.string().trim().min(1).max(120).optional(),
    materials: z
      .preprocess(
        (value) =>
          typeof value === 'string'
            ? value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)
            : value,
        z.array(z.string().trim().min(1).max(80)).max(20),
      )
      .optional(),
    sort: z.enum(['newest', 'oldest']).default('newest'),
  })
  .strict();

export const portfolioWorksResponseSchema = z
  .object({
    works: z.array(portfolioWorkListItemSchema),
    pagination: paginationMetaSchema,
  })
  .strict();

export const portfolioAuthorsQuerySchema = paginationQuerySchema
  .extend({
    q: z.string().trim().min(1).max(120).optional(),
    tag: z.string().trim().min(1).max(160).optional(),
    city: z.string().trim().min(1).max(160).optional(),
    sort: z.enum(['name', 'added']).default('added'),
  })
  .strict();

export const portfolioAuthorsResponseSchema = z
  .object({
    authors: z.array(
      z
        .object({
          author: portfolioAuthorSchema,
          workCount: z.number().int().nonnegative(),
        })
        .strict(),
    ),
    pagination: paginationMetaSchema,
  })
  .strict();

export const portfolioDiscoveryFacetsResponseSchema = z
  .object({
    materials: z.array(publicText),
    cities: z.array(publicText),
    tags: z.array(publicText),
  })
  .strict();

export const portfolioAuthorDetailResponseSchema = z
  .object({
    author: portfolioAuthorSchema,
    works: z.array(portfolioWorkListItemSchema),
    pagination: paginationMetaSchema,
  })
  .strict();

export const portfolioHomeWorkSchema = portfolioWorkSchema
  .extend({
    author: portfolioAuthorSchema,
  })
  .strict();

export const portfolioHomeCuratorSelectionSchema = z
  .object({
    curator: portfolioAuthorSchema,
    work: portfolioHomeWorkSchema,
    note: publicText.max(2_000).nullable(),
  })
  .strict();

export const portfolioHomeResponseSchema = z
  .object({
    curatorSelection: portfolioHomeCuratorSelectionSchema.nullable(),
    newWorks: z.array(portfolioWorkListItemSchema),
    newAuthors: z.array(portfolioAuthorSchema),
  })
  .strict();

export const portfolioCabinetWorkSchema = z
  .object({
    id: uuidSchema,
    publicId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
    title: z.string().trim().min(1).nullable(),
    status: productStatusSchema,
    updatedAt: z.string().datetime(),
    moderationMessage: z.string().nullable(),
  })
  .strict();

export const portfolioCabinetWorksResponseSchema = z
  .object({ works: z.array(portfolioCabinetWorkSchema) })
  .strict();

export const portfolioAuthorApplicationSchema = z
  .object({
    slug: slugSchema,
    fullName: publicText,
    country: publicText,
    city: publicText.nullable(),
    discipline: publicText.nullable(),
    practice: z.string().trim().min(1).nullable(),
    shortDescription: publicText.nullable(),
    status: sellerStatusSchema,
    applicationStage: authorApplicationStageSchema.nullable().optional(),
  })
  .strict()
  .superRefine((application, context) => {
    if (application.status === 'DRAFT') return;
    if (!application.discipline) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discipline'],
        message: 'A non-draft application requires a discipline',
      });
    }
    if (!application.shortDescription) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['shortDescription'],
        message: 'A non-draft application requires a short description',
      });
    }
  });

export const portfolioAuthorApplicationResponseSchema = z
  .object({
    application: portfolioAuthorApplicationSchema,
    editingRevision: z
      .object({
        id: uuidSchema,
        version: z.number().int().positive(),
        status: sellerProfileRevisionStatusSchema,
        updatedAt: isoDateTimeSchema,
      })
      .strict()
      .nullable(),
    achievements: z.array(portfolioAchievementSchema),
  })
  .strict();

const portfolioAchievementOccurredDateWriteSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  },
  portfolioAchievementSchema.shape.occurredDate.unwrap(),
);

export const portfolioAchievementWriteRequestSchema = z
  .object({
    occurredDate: portfolioAchievementOccurredDateWriteSchema,
    body: publicText.max(4_000),
  })
  .strict();

export const portfolioAchievementResponseSchema = z
  .object({
    achievement: portfolioAchievementSchema,
  })
  .strict();

export const portfolioOkResponseSchema = z
  .object({
    ok: z.literal(true),
  })
  .strict();

export type PortfolioAchievementWriteRequest = z.infer<
  typeof portfolioAchievementWriteRequestSchema
>;

export type PortfolioWorksQuery = z.output<typeof portfolioWorksQuerySchema>;
export type PortfolioAuthorsQuery = z.output<
  typeof portfolioAuthorsQuerySchema
>;
export type PortfolioDiscoveryFacetsResponse = z.output<
  typeof portfolioDiscoveryFacetsResponseSchema
>;
export type PortfolioWorkDetailResponse = z.infer<
  typeof portfolioWorkDetailResponseSchema
>;
