type ProductApprovalInput = {
  title: string | null;
  categoryId: string | null;
  images: Array<{ id: string }>;
};

const requiredTextFields = ['title', 'categoryId'] as const;

export function missingProductApprovalFields(
  product: ProductApprovalInput,
): string[] {
  const missing: string[] = requiredTextFields.filter(
    (field) => !product[field],
  );
  if (product.images.length < 1) missing.push('images');
  return missing;
}
