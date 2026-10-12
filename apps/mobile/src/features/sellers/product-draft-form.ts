import { z } from 'zod';

import {
  productWriteRequestSchema,
  type Product,
  type ProductWriteRequest,
  type SellerProductDetailResponse,
} from '@bidplace/contracts';

const draftTextSchema = z.string();
const draftYearSchema = z.string().refine((value) => {
  if (!value.trim()) return true;
  const year = Number(value);
  return Number.isInteger(year) && year >= 0 && year <= 9999;
}, 'Введите год числом от 0 до 9999');

export const productDraftFormSchema = z
  .object({
    categoryId: draftTextSchema,
    title: draftTextSchema,
    materialTermIds: z.array(z.string().uuid()).max(40),
    techniqueTermIds: z.array(z.string().uuid()).max(40),
    materialProposals: z.array(z.string().trim().min(1).max(160)).max(20),
    techniqueProposals: z.array(z.string().trim().min(1).max(160)).max(20),
    categoryProposal: z.string().max(160),
    dimensions: draftTextSchema,
    year: draftYearSchema,
    uniqueness: draftTextSchema,
    story: draftTextSchema,
  })
  .strict();

export type ProductDraftFormValues = z.infer<typeof productDraftFormSchema>;

export const emptyProductDraftFormValues: ProductDraftFormValues = {
  categoryId: '',
  title: '',
  materialTermIds: [],
  techniqueTermIds: [],
  materialProposals: [],
  techniqueProposals: [],
  categoryProposal: '',
  dimensions: '',
  year: '',
  uniqueness: '',
  story: '',
};

export function productToDraftFormValues(
  product: Product,
  selection?: SellerProductDetailResponse['selection'],
  submitted?: ProductDraftFormValues,
): ProductDraftFormValues {
  const selectedProposals = selection?.proposals.filter((proposal) => proposal.selected);
  return {
    categoryId: product.categoryId ?? '',
    title: product.title ?? '',
    materialTermIds: selection?.materialTermIds ?? submitted?.materialTermIds ?? [],
    techniqueTermIds: selection?.techniqueTermIds ?? submitted?.techniqueTermIds ?? [],
    materialProposals: selectedProposals
      ? selectedProposals.filter((proposal) => proposal.kind === 'MATERIAL').map((proposal) => proposal.rawName)
      : (submitted?.materialProposals ?? []),
    techniqueProposals: selectedProposals
      ? selectedProposals.filter((proposal) => proposal.kind === 'TECHNIQUE').map((proposal) => proposal.rawName)
      : (submitted?.techniqueProposals ?? []),
    categoryProposal: selectedProposals
      ? (selectedProposals.find((proposal) => proposal.kind === 'CATEGORY')?.rawName ?? '')
      : (submitted?.categoryProposal ?? ''),
    dimensions: product.dimensions ?? '',
    year: product.year?.toString() ?? '',
    uniqueness: product.uniqueness ?? '',
    story: product.story ?? '',
  };
}

function nullableText(value: string): string | null {
  return value.trim() || null;
}

export function productDraftToWriteRequest(
  values: ProductDraftFormValues,
): ProductWriteRequest {
  const parsed = productDraftFormSchema.parse(values);
  return productWriteRequestSchema.parse({
    categoryId: nullableText(parsed.categoryId),
    title: nullableText(parsed.title),
    materialTermIds: parsed.materialTermIds,
    techniqueTermIds: parsed.techniqueTermIds,
    materialProposals: parsed.materialProposals,
    techniqueProposals: parsed.techniqueProposals,
    categoryProposal: nullableText(parsed.categoryProposal),
    dimensions: nullableText(parsed.dimensions),
    year: parsed.year.trim() ? Number(parsed.year) : null,
    uniqueness: nullableText(parsed.uniqueness),
    story: nullableText(parsed.story),
  });
}

export function productDraftRequiredErrors(values: ProductDraftFormValues) {
  return {
    categoryId: values.categoryId.trim() ? undefined : 'Выберите категорию',
    title: values.title.trim() ? undefined : 'Введите название',
  };
}

export function shouldHydrateProductDraft(input: {
  hydratedProductId: string | null;
  hydratedUpdatedAt: string | null;
  nextProductId: string;
  nextUpdatedAt: string;
  isDirty: boolean;
}): boolean {
  if (input.hydratedProductId !== input.nextProductId) return true;
  return !input.isDirty && input.hydratedUpdatedAt !== input.nextUpdatedAt;
}
