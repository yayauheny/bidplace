import { describe, expect, it } from 'vitest';

import {
  canSubmitSellerProfileRevision,
  isSellerProfileFormEditable,
} from './seller-profile-editable';

describe('seller profile cabinet editable matrix', () => {
  it.each([
    [undefined, undefined, true],
    [{ status: 'CHANGES_REQUESTED' }, { status: 'PENDING_REVIEW' }, true],
    [{ status: 'APPROVED' }, { status: 'DRAFT' }, true],
    [{ status: 'APPROVED' }, { status: 'CHANGES_REQUESTED' }, true],
    [{ status: 'REJECTED' }, { status: 'REJECTED' }, true],
    [{ status: 'APPROVED' }, { status: 'APPROVED' }, false],
    [{ status: 'APPROVED' }, { status: 'PENDING_REVIEW' }, false],
    [{ status: 'PENDING_REVIEW' }, { status: 'PENDING_REVIEW' }, false],
    [{ status: 'SUSPENDED' }, { status: 'DRAFT' }, false],
  ] as const)(
    'editable(%j, %j) is %s',
    (profile, revision, expected) => {
      expect(isSellerProfileFormEditable(profile, revision)).toBe(expected);
    },
  );

  it('allows submit only for an existing editable revision', () => {
    expect(canSubmitSellerProfileRevision(undefined, { status: 'DRAFT' })).toBe(
      false,
    );
    expect(
      canSubmitSellerProfileRevision(
        { status: 'APPROVED' },
        { status: 'DRAFT' },
      ),
    ).toBe(true);
    expect(
      canSubmitSellerProfileRevision(
        { status: 'APPROVED' },
        { status: 'PENDING_REVIEW' },
      ),
    ).toBe(false);
  });
});
