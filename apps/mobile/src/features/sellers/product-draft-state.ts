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

export type ProductRevisionIdentity = {
  id: string;
  version: number;
  updatedAt: string;
};

const moderationDecisionStatuses = new Set<ProductStatus>([
  'APPROVED',
  'CHANGES_REQUESTED',
  'REJECTED',
]);

export function isOlderProductRevision(
  current: ProductRevisionIdentity,
  incoming: ProductRevisionIdentity,
): boolean {
  if (incoming.version !== current.version) return incoming.version < current.version;
  if (incoming.id !== current.id) return false;
  return incoming.updatedAt < current.updatedAt;
}

export function shouldKeepCachedProductRevision(
  cached: { editingRevision: ProductRevisionIdentity | null } | undefined,
  incoming: { editingRevision: ProductRevisionIdentity | null },
): boolean {
  const current = cached?.editingRevision;
  if (!current) return false;
  if (!incoming.editingRevision) return true;
  return isOlderProductRevision(current, incoming.editingRevision);
}

export function isNewerModerationDecision(
  submitted: ProductRevisionIdentity,
  incoming: ProductRevisionIdentity & { status: ProductStatus },
): boolean {
  const newer =
    incoming.version !== submitted.version
      ? incoming.version > submitted.version
      : incoming.id === submitted.id && incoming.updatedAt > submitted.updatedAt;
  return newer && moderationDecisionStatuses.has(incoming.status);
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
