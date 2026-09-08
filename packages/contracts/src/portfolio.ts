import { z } from 'zod';

import { paginationMetaSchema, paginationQuerySchema } from './pagination';
import { productImageSchema } from './product';
import { slugSchema, uuidSchema } from './primitives';

const publicText = z.string().trim().min(1);

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
    images: z.array(productImageSchema).nonempty(),
    publishedAt: z.string().datetime(),
  })
  .strict();

export const portfolioAuthorSchema = z
  .object({
    id: uuidSchema,
    slug: slugSchema,
    fullName: publicText,
    country: publicText,
    discipline: publicText,
    profilePhotoUrl: z
      .string()
      .regex(/^\/api\/sellers\/[A-Za-z0-9_-]+\/photo$/),
    telegramUrl: z.string().url().nullable(),
    instagramUrl: z.string().url().nullable(),
    websiteUrl: z.string().url().nullable(),
    shortDescription: publicText,
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

export const portfolioAuthorDetailResponseSchema = z
  .object({
    author: portfolioAuthorSchema,
    works: z.array(portfolioWorkListItemSchema),
    pagination: paginationMetaSchema,
  })
  .strict();

export const portfolioHomeResponseSchema = z
  .object({
    curatorSelection: portfolioWorkListItemSchema.nullable(),
    newWorks: z.array(portfolioWorkListItemSchema),
    newAuthors: z.array(portfolioAuthorSchema),
  })
  .strict();

export type PortfolioWorksQuery = z.output<typeof portfolioWorksQuerySchema>;
export type PortfolioAuthorsQuery = z.output<
  typeof portfolioAuthorsQuerySchema
>;
