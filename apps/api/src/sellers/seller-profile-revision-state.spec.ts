import { describe, expect, it } from 'vitest';

import {
  assertSellerProfileRevisionTransition,
  canAuthorEditSellerProfileRevision,
} from './seller-profile-revision-state';

describe('seller profile revision state', () => {
  it('allows an author to resubmit requested changes', () => {
    expect(() =>
      assertSellerProfileRevisionTransition(
        'author',
        'CHANGES_REQUESTED',
        'PENDING_REVIEW',
      ),
    ).not.toThrow();
  });

  it('allows an administrator to decide a pending revision', () => {
    expect(() =>
      assertSellerProfileRevisionTransition(
        'admin',
        'PENDING_REVIEW',
        'APPROVED',
      ),
    ).not.toThrow();
  });

  it('rejects direct approval of a rejected revision', () => {
    expect(() =>
      assertSellerProfileRevisionTransition('admin', 'REJECTED', 'APPROVED'),
    ).toThrow('Seller profile revision transition is not allowed');
  });

  it('locks a pending revision against author edits', () => {
    expect(canAuthorEditSellerProfileRevision('PENDING_REVIEW')).toBe(false);
    expect(canAuthorEditSellerProfileRevision('DRAFT')).toBe(true);
  });
});
