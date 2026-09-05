import {
  isEditableProductStatus,
  type ProductStatus,
} from '@bidplace/contracts';

export function canOwnerEditProduct(status?: ProductStatus): boolean {
  return status === undefined || isEditableProductStatus(status);
}

export function ownerProductSubmitLabel(status?: ProductStatus): string {
  return status === 'CHANGES_REQUESTED' || status === 'REJECTED'
    ? 'Повторно отправить на модерацию'
    : 'Отправить на модерацию';
}

export function ownerModerationReasonNotice(
  status: ProductStatus | undefined,
  reason: string | null | undefined,
): { title: string; body: string } | null {
  if (!reason) return null;
  if (status === 'REJECTED') {
    return { title: 'Работа отклонена', body: reason };
  }
  if (status === 'CHANGES_REQUESTED') {
    return { title: 'Нужны правки', body: reason };
  }
  return null;
}
