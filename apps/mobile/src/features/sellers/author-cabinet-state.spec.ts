import { describe, expect, it } from 'vitest';

import {
  authorCabinetPrimaryAction,
  authorCabinetQuery,
  authorCabinetVisibilityActions,
  authorCabinetWorksFromPages,
  authorCabinetWorkState,
} from './author-cabinet-state';

describe('author cabinet state', () => {
  it('keeps parent visibility and editing revision status distinct', () => {
    expect(
      authorCabinetWorkState({
        status: 'APPROVED',
        editingRevisionStatus: 'PENDING_REVIEW',
      }),
    ).toBe('Опубликовано · изменения на модерации');
    expect(
      authorCabinetWorkState({
        status: 'APPROVED',
        editingRevisionStatus: 'DRAFT',
      }),
    ).toBe('Опубликовано · есть новая версия');
  });

  it('uses the canonical owner pagination size', () => {
    expect(authorCabinetQuery(2)).toEqual({ page: 2, limit: 20 });
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

  it('shows rejected revisions and does not promise editing while pending or suspended', () => {
    expect(
      authorCabinetWorkState({
        status: 'APPROVED',
        editingRevisionStatus: 'REJECTED',
      }),
    ).toBe('Опубликовано · изменения отклонены');
    expect(
      authorCabinetPrimaryAction({
        status: 'APPROVED',
        editingRevisionStatus: 'PENDING_REVIEW',
        isSuspended: false,
      }),
    ).toBe('Открыть');
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
});
