import { describe, expect, it } from 'vitest';

import {
  authorCabinetQuery,
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
});
