import {
  isEditableProductStatus,
  type ProductStatus,
} from '@bidplace/contracts';

export function canOwnerEditProduct(
  status?: ProductStatus,
  editingRevisionStatus?: ProductStatus | null,
): boolean {
  if (status === undefined) return true;
  if (isEditableProductStatus(status)) return true;
  if (status !== 'APPROVED' && status !== 'ARCHIVED') return false;
  return (
    editingRevisionStatus === 'APPROVED' ||
    (editingRevisionStatus !== undefined &&
      editingRevisionStatus !== null &&
      isEditableProductStatus(editingRevisionStatus))
  );
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
