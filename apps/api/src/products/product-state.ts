import { type ProductStatus } from '@bidplace/contracts';

export function isEditableProductStatus(status: ProductStatus): boolean {
  return status === 'DRAFT' || status === 'CHANGES_REQUESTED';
}
