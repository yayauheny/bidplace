import type { PortfolioCabinetWorksQuery } from '@bidplace/contracts';

export const AUTHOR_CABINET_PAGE_SIZE = 20;

export function authorCabinetQuery(page: number): PortfolioCabinetWorksQuery {
  return { page, limit: AUTHOR_CABINET_PAGE_SIZE };
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

export function authorCabinetPrimaryAction(status: string) {
  return status === 'PENDING_REVIEW' ? 'Открыть' : 'Редактировать';
}
