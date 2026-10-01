import { describe, expect, it } from 'vitest';

import {
  authorCabinetPrimaryAction,
  authorCabinetVisibilityActions,
  authorCabinetWorksFromPages,
  authorCabinetWorkState,
} from './author-cabinet-state';

describe('author cabinet state', () => {
  it.each([
    ['APPROVED', 'APPROVED', 'Опубликовано', 'Редактировать'],
    ['APPROVED', 'DRAFT', 'Опубликовано · есть новая версия', 'Редактировать'],
    [
      'APPROVED',
      'PENDING_REVIEW',
      'Опубликовано · изменения на модерации',
      'Открыть',
    ],
    ['APPROVED', 'CHANGES_REQUESTED', 'Опубликовано · нужны правки', 'Редактировать'],
    [
      'APPROVED',
      'REJECTED',
      'Опубликовано · изменения отклонены',
      'Редактировать',
    ],
    ['ARCHIVED', 'APPROVED', 'Скрыто', 'Редактировать'],
    ['ARCHIVED', 'DRAFT', 'Скрыто · есть новая версия', 'Редактировать'],
    [
      'ARCHIVED',
      'PENDING_REVIEW',
      'Скрыто · изменения на модерации',
      'Открыть',
    ],
    ['ARCHIVED', 'CHANGES_REQUESTED', 'Скрыто · нужны правки', 'Редактировать'],
    [
      'ARCHIVED',
      'REJECTED',
      'Скрыто · изменения отклонены',
      'Редактировать',
    ],
  ])(
    'shows %s with %s editing revision as %s and %s',
    (status, editingRevisionStatus, state, action) => {
      expect(
        authorCabinetWorkState({ status, editingRevisionStatus }),
      ).toBe(state);
      expect(
        authorCabinetPrimaryAction({
          status,
          editingRevisionStatus,
          isSuspended: false,
        }),
      ).toBe(action);
    },
  );

  it('keeps suspended authors inspection-only', () => {
    expect(
      authorCabinetPrimaryAction({
        status: 'ARCHIVED',
        editingRevisionStatus: 'APPROVED',
        isSuspended: true,
      }),
    ).toBe('Открыть');
    expect(
      authorCabinetVisibilityActions({
        status: 'ARCHIVED',
        isSuspended: true,
      }),
    ).toEqual({ canHide: false, canRestore: false });
  });

  it('retains page one while appending a later cabinet page', () => {
    const work = (index: number) => ({
      id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
      publicId: `cabinet${String(index).padStart(4, '0')}`,
      title: String(index),
      status: 'DRAFT' as const,
      editingRevisionStatus: 'DRAFT' as const,
      updatedAt: '2026-09-24T10:00:00.000Z',
      moderationMessage: null,
      coverImage: null,
    });
    const first = Array.from({ length: 20 }, (_, index) => work(index));
    const second = Array.from({ length: 5 }, (_, index) => work(index + 20));

    expect(
      authorCabinetWorksFromPages([
        { works: first, pagination: { page: 1, limit: 20, total: 25 } },
        { works: second, pagination: { page: 2, limit: 20, total: 25 } },
      ]).map((item) => item.title),
    ).toEqual([...first, ...second].map((item) => item.title));
  });

});
