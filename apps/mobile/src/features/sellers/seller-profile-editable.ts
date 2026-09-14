const editableRevisionStatuses = [
  'DRAFT',
  'CHANGES_REQUESTED',
  'REJECTED',
] as const;

type EditableRevisionStatus = (typeof editableRevisionStatuses)[number];

export function isEditableProfileRevisionStatus(
  status: string | null | undefined,
): status is EditableRevisionStatus {
  return editableRevisionStatuses.some((value) => value === status);
}

export function isSellerProfileFormEditable(
  profile: { status: string } | null | undefined,
  editingRevision: { status: string } | null | undefined,
): boolean {
  if (!profile) return true;
  if (profile.status === 'SUSPENDED' || profile.status === 'PENDING_REVIEW') {
    return false;
  }
  if (profile.status === 'CHANGES_REQUESTED') return true;
  if (profile.status === 'REJECTED') {
    return isEditableProfileRevisionStatus(editingRevision?.status);
  }
  if (profile.status === 'APPROVED') {
    if (!editingRevision || editingRevision.status === 'APPROVED') {
      return true;
    }
    return isEditableProfileRevisionStatus(editingRevision.status);
  }
  return false;
}

export function canSubmitSellerProfileRevision(
  profile: { status: string } | null | undefined,
  editingRevision: { status: string } | null | undefined,
): boolean {
  if (!profile) return false;
  if (profile.status === 'SUSPENDED') return false;
  return isEditableProfileRevisionStatus(editingRevision?.status);
}
