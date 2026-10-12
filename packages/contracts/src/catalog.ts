import { z } from 'zod';

import { isoDateTimeSchema, slugSchema, uuidSchema } from './primitives';

export const WORK_CATALOG_LIMITS = {
  nameLength: 160,
  termsPerRole: 40,
  proposalsPerRole: 20,
} as const;

export const catalogTermRoleSchema = z.enum(['MATERIAL', 'TECHNIQUE']);
export const catalogProposalKindSchema = z.enum(['CATEGORY', 'MATERIAL', 'TECHNIQUE']);
export const catalogProposalStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

export const catalogTermSchema = z
  .object({
    id: uuidSchema,
    role: catalogTermRoleSchema,
    slug: slugSchema,
    name: z.string().trim().min(1).max(WORK_CATALOG_LIMITS.nameLength),
    active: z.boolean(),
  })
  .strict();

export const catalogTermListResponseSchema = z
  .object({ terms: z.array(catalogTermSchema) })
  .strict();

export const countryOptionSchema = z
  .object({
    code: z.string().regex(/^[A-Z]{2}$/),
    name: z.string().trim().min(1),
  })
  .strict();

export const countryListResponseSchema = z
  .object({ countries: z.array(countryOptionSchema) })
  .strict();

export const catalogProposalSchema = z
  .object({
    id: uuidSchema,
    productRevisionId: uuidSchema,
    kind: catalogProposalKindSchema,
    rawName: z.string().trim().min(1).max(WORK_CATALOG_LIMITS.nameLength),
    normalizedName: z.string().trim().min(1).max(WORK_CATALOG_LIMITS.nameLength),
    status: catalogProposalStatusSchema,
    selected: z.boolean(),
    mappedCategoryId: uuidSchema.nullable(),
    mappedTermId: uuidSchema.nullable(),
    rejectionReason: z.string().trim().min(1).nullable(),
    reviewedAt: isoDateTimeSchema.nullable(),
  })
  .strict();

const catalogNameSchema = z.string().trim().min(1).max(WORK_CATALOG_LIMITS.nameLength);

export const catalogTermWriteSchema = z
  .object({
    role: catalogTermRoleSchema,
    name: catalogNameSchema,
    slug: slugSchema.optional(),
  })
  .strict();

export const catalogCategoryWriteSchema = z
  .object({
    name: catalogNameSchema,
    slug: slugSchema.optional(),
    description: z.string().trim().min(1).max(2000).nullable().optional(),
  })
  .strict();

export const catalogRenameSchema = z
  .object({ name: catalogNameSchema })
  .strict();

export const catalogActiveSchema = z
  .object({ active: z.boolean() })
  .strict();

export const catalogProposalMapSchema = z
  .object({
    categoryId: uuidSchema.optional(),
    termId: uuidSchema.optional(),
  })
  .strict()
  .refine((value) => Number(Boolean(value.categoryId)) + Number(Boolean(value.termId)) === 1, {
    message: 'Map a proposal to one category or one term',
  });

export const catalogProposalRejectSchema = z
  .object({ reason: z.string().trim().min(1).max(2000) })
  .strict();

export const selectedCategorySchema = z
  .object({
    id: uuidSchema,
    slug: z.string().trim().min(1),
    name: z.string().trim().min(1),
    description: z.string().trim().min(1).nullable(),
    active: z.boolean(),
  })
  .strict();

export function normalizeCatalogName(value: string): string {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('ru');
}

export const workSelectionViewSchema = z
  .object({
    category: selectedCategorySchema.nullable(),
    materialTermIds: z.array(uuidSchema),
    techniqueTermIds: z.array(uuidSchema),
    materialTerms: z.array(catalogTermSchema),
    techniqueTerms: z.array(catalogTermSchema),
    proposals: z.array(catalogProposalSchema),
  })
  .strict();

export const workSelectionSchema = z
  .object({
    materialTermIds: z.array(uuidSchema).max(WORK_CATALOG_LIMITS.termsPerRole).optional(),
    techniqueTermIds: z.array(uuidSchema).max(WORK_CATALOG_LIMITS.termsPerRole).optional(),
    materialProposals: z.array(catalogNameSchema).max(WORK_CATALOG_LIMITS.proposalsPerRole).optional(),
    techniqueProposals: z.array(catalogNameSchema).max(WORK_CATALOG_LIMITS.proposalsPerRole).optional(),
    categoryProposal: catalogNameSchema.nullable().optional(),
  })
  .strict();
