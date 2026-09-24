import type {
  PortfolioCabinetWorksQuery,
  PortfolioCabinetWorksResponse,
} from '@bidplace/contracts';

export const AUTHOR_CABINET_PAGE_SIZE = 20;

export function authorCabinetQuery(page: number): PortfolioCabinetWorksQuery {
  return { page, limit: AUTHOR_CABINET_PAGE_SIZE };
}

export function authorCabinetWorksFromPages(
  pages: PortfolioCabinetWorksResponse[],
) {
  return pages.flatMap((page) => page.works);
}

export function authorCabinetWorkState(input: {
  status: string;
  editingRevisionStatus: string | null;
}) {
  if (input.status === 'ARCHIVED') return 'Скрыто';
  if (input.status === 'APPROVED') {
    if (input.editingRevisionStatus === 'PENDING_REVIEW') {
      return 'Опубликовано · изменения на модерации';
    }
    if (input.editingRevisionStatus === 'CHANGES_REQUESTED') {
      return 'Опубликовано · нужны правки';
    }
    if (input.editingRevisionStatus === 'REJECTED') {
      return 'Опубликовано · изменения отклонены';
    }
    if (input.editingRevisionStatus === 'DRAFT') {
      return 'Опубликовано · есть новая версия';
    }
    return 'Опубликовано';
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
  if (
    input.status === 'APPROVED' &&
    input.editingRevisionStatus === 'PENDING_REVIEW'
  ) {
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
