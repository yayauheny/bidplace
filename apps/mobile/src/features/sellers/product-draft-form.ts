import { z } from 'zod';

import {
  productWriteRequestSchema,
  type Product,
  type ProductWriteRequest,
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
    technique: draftTextSchema,
    materials: draftTextSchema,
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
  technique: '',
  materials: '',
  dimensions: '',
  year: '',
  uniqueness: '',
  story: '',
};

export function productToDraftFormValues(
  product: Product,
): ProductDraftFormValues {
  return {
    categoryId: product.categoryId ?? '',
    title: product.title ?? '',
    technique: product.technique ?? '',
    materials: product.materials ?? '',
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
    technique: nullableText(parsed.technique),
    materials: nullableText(parsed.materials),
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

export async function persistProductDraftBeforeSubmit<T>(
  persist: () => Promise<unknown>,
  submit: () => Promise<T>,
): Promise<T> {
  await persist();
  return submit();
}
