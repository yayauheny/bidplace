import { ConflictException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import {
  assertProductRevisionTransition,
  canAuthorEditRevision,
} from './product-revision-state';

describe('product revision state', () => {
  it('allows author submit, resubmit, hide and unhide transitions', () => {
    expect(() =>
      assertProductRevisionTransition('author', 'DRAFT', 'PENDING_REVIEW'),
    ).not.toThrow();
    expect(() =>
      assertProductRevisionTransition('author', 'REJECTED', 'PENDING_REVIEW'),
    ).not.toThrow();
    expect(() =>
      assertProductRevisionTransition('author', 'APPROVED', 'ARCHIVED'),
    ).not.toThrow();
    expect(() =>
      assertProductRevisionTransition('author', 'ARCHIVED', 'APPROVED'),
    ).not.toThrow();
  });

  it('allows only a reviewer to publish, request changes or reject', () => {
    for (const next of ['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'] as const) {
      expect(() =>
        assertProductRevisionTransition('admin', 'PENDING_REVIEW', next),
      ).not.toThrow();
      expect(() =>
        assertProductRevisionTransition('author', 'PENDING_REVIEW', next),
      ).toThrow(ConflictException);
    }
  });

  it('keeps author editing separate from published visibility', () => {
    expect(canAuthorEditRevision('DRAFT')).toBe(true);
    expect(canAuthorEditRevision('APPROVED')).toBe(false);
  });
});
