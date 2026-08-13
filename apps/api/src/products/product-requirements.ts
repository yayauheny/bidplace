type ProductApprovalInput = {
  title: string | null;
  story: string | null;
  categoryId: string | null;
  condition: string | null;
  uniqueness: string | null;
  provenance: string | null;
  city: string | null;
  packaging: string | null;
  deliveryInfo: string | null;
  images: Array<{ id: string }>;
};

const requiredTextFields = [
  'title',
  'story',
  'categoryId',
  'uniqueness',
  'provenance',
  'city',
  'deliveryInfo',
] as const;

export function missingProductApprovalFields(
  product: ProductApprovalInput,
): string[] {
  const missing: string[] = requiredTextFields.filter(
    (field) => !product[field],
  );
  if (product.images.length < 1) missing.push('images');
  return missing;
}
