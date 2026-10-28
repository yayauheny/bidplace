import type { PortfolioCabinetWorksResponse } from '@bidplace/contracts';

export const AUTHOR_CABINET_PAGE_SIZE = 20;

export function authorCabinetWorksFromPages(
  pages: PortfolioCabinetWorksResponse[],
) {
  return pages.flatMap((page) => page.works);
}

function authorCabinetRevisionState(
  prefix: 'Опубликовано' | 'Скрыто',
  editingRevisionStatus: string | null,
) {
  if (editingRevisionStatus === 'PENDING_REVIEW') {
    return `${prefix} · изменения на модерации`;
  }
  if (editingRevisionStatus === 'CHANGES_REQUESTED') {
    return `${prefix} · нужны правки`;
  }
  if (editingRevisionStatus === 'REJECTED') {
    return `${prefix} · изменения отклонены`;
  }
  if (editingRevisionStatus === 'DRAFT') {
    return `${prefix} · есть новая версия`;
  }
  return prefix;
}

export function authorCabinetWorkState(input: {
  status: string;
  editingRevisionStatus: string | null;
}) {
  if (input.status === 'ARCHIVED') {
    return authorCabinetRevisionState('Скрыто', input.editingRevisionStatus);
  }
  if (input.status === 'APPROVED') {
    return authorCabinetRevisionState(
      'Опубликовано',
      input.editingRevisionStatus,
    );
  }
  if (input.status === 'PENDING_REVIEW') return 'На модерации';
  if (input.status === 'CHANGES_REQUESTED') return 'Нужны правки';
  if (input.status === 'REJECTED') return 'Отклонено';
  return 'Черновик';
}

export function authorCabinetPrimaryAction(input: {
  status: string;
  editingRevisionStatus: string | null;
  isSuspended: boolean;
}) {
  if (input.isSuspended || input.status === 'PENDING_REVIEW') return 'Открыть';
  if (input.editingRevisionStatus === 'PENDING_REVIEW') {
    return 'Открыть';
  }
  return 'Редактировать';
}

export function authorCabinetVisibilityActions(input: {
  status: string;
  isSuspended: boolean;
}) {
  if (input.isSuspended) return { canHide: false, canRestore: false };
  return {
    canHide: input.status === 'APPROVED',
    canRestore: input.status === 'ARCHIVED',
  };
}
