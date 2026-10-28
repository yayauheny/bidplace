import { describe, expect, it } from 'vitest';

import {
  canOwnerEditProduct,
  isNewerModerationDecision,
  isOlderProductRevision,
  nextPostSubmitHold,
  ownerModerationReasonNotice,
  ownerProductSubmitLabel,
  type ProductRevisionIdentity,
} from './product-draft-state';

describe('product draft owner recovery', () => {
  it('hydrates drafts and editable published revisions without opening pending revisions', () => {
    expect(canOwnerEditProduct(undefined)).toBe(true);
    expect(canOwnerEditProduct('DRAFT')).toBe(true);
    expect(canOwnerEditProduct('CHANGES_REQUESTED')).toBe(true);
    expect(canOwnerEditProduct('REJECTED')).toBe(true);
    expect(canOwnerEditProduct('PENDING_REVIEW')).toBe(false);
    expect(canOwnerEditProduct('APPROVED')).toBe(false);
    expect(canOwnerEditProduct('APPROVED', 'APPROVED')).toBe(true);
    expect(canOwnerEditProduct('APPROVED', 'DRAFT')).toBe(true);
    expect(canOwnerEditProduct('APPROVED', 'CHANGES_REQUESTED')).toBe(true);
    expect(canOwnerEditProduct('APPROVED', 'PENDING_REVIEW')).toBe(false);
    expect(canOwnerEditProduct('ARCHIVED', 'REJECTED')).toBe(true);
  });

  it('shows the latest rejection or correction reason only while the form is recoverable', () => {
    expect(
      ownerModerationReasonNotice('REJECTED', 'Provenance is missing'),
    ).toEqual({
      title: 'Работа отклонена',
      body: 'Provenance is missing',
    });
    expect(
      ownerModerationReasonNotice('CHANGES_REQUESTED', 'Добавьте историю'),
    ).toEqual({
      title: 'Нужны правки',
      body: 'Добавьте историю',
    });
    expect(
      ownerModerationReasonNotice('PENDING_REVIEW', 'Provenance is missing'),
    ).toBeNull();
    expect(ownerModerationReasonNotice('REJECTED', null)).toBeNull();
    expect(ownerModerationReasonNotice('DRAFT', 'Old reason')).toBeNull();
  });

  it('labels rejected resubmission as a repeat moderation send', () => {
    expect(ownerProductSubmitLabel('REJECTED')).toBe(
      'Повторно отправить на модерацию',
    );
    expect(ownerProductSubmitLabel('CHANGES_REQUESTED')).toBe(
      'Повторно отправить на модерацию',
    );
    expect(ownerProductSubmitLabel('DRAFT')).toBe('Отправить на модерацию');
  });

  it('treats revision identity as the moderation clock', () => {
    const submitted: ProductRevisionIdentity = {
      id: 'revision-1',
      version: 2,
      updatedAt: '2026-09-27T00:00:00.000Z',
    };
    expect(
      isOlderProductRevision(submitted, {
        ...submitted,
        updatedAt: '2026-09-26T00:00:00.000Z',
      }),
    ).toBe(true);
    expect(isOlderProductRevision(submitted, submitted)).toBe(false);
    expect(
      isOlderProductRevision(submitted, {
        id: 'revision-2',
        version: 2,
        updatedAt: '2026-09-26T00:00:00.000Z',
      }),
    ).toBe(false);
    expect(
      isNewerModerationDecision(submitted, {
        ...submitted,
        status: 'APPROVED',
        updatedAt: '2026-09-30T00:00:00.000Z',
      }),
    ).toBe(true);
    expect(
      isNewerModerationDecision(submitted, {
        ...submitted,
        status: 'CHANGES_REQUESTED',
        updatedAt: '2026-09-30T00:00:00.000Z',
      }),
    ).toBe(true);
    expect(
      isNewerModerationDecision(submitted, {
        ...submitted,
        status: 'REJECTED',
        updatedAt: '2026-09-30T00:00:00.000Z',
      }),
    ).toBe(true);
    expect(
      isNewerModerationDecision(submitted, {
        ...submitted,
        status: 'PENDING_REVIEW',
        updatedAt: '2026-09-30T00:00:00.000Z',
      }),
    ).toBe(false);
    expect(
      isNewerModerationDecision(submitted, {
        ...submitted,
        status: 'CHANGES_REQUESTED',
      }),
    ).toBe(false);
    expect(
      isNewerModerationDecision(submitted, {
        id: 'revision-9',
        version: 3,
        status: 'APPROVED',
        updatedAt: '2026-09-01T00:00:00.000Z',
      }),
    ).toBe(true);
  });

  it('raises the post-submit floor without treating a non-decision as a release', () => {
    const floor = { id: 'revision-1', version: 2, updatedAt: '2026-09-27T00:00:00.000Z' };
    const pending = {
      id: floor.id,
      version: floor.version,
      status: 'PENDING_REVIEW' as const,
      updatedAt: '2026-09-29T00:00:00.000Z',
    };
    expect(nextPostSubmitHold(floor, pending)).toEqual({
      open: false,
      floor: { id: pending.id, version: pending.version, updatedAt: pending.updatedAt },
    });
    expect(
      nextPostSubmitHold(
        { id: pending.id, version: pending.version, updatedAt: pending.updatedAt },
        { ...pending, status: 'CHANGES_REQUESTED', updatedAt: '2026-09-28T00:00:00.000Z' },
      ),
    ).toEqual({
      open: false,
      floor: { id: pending.id, version: pending.version, updatedAt: pending.updatedAt },
    });
    expect(
      nextPostSubmitHold(
        { id: pending.id, version: pending.version, updatedAt: pending.updatedAt },
        { ...pending, status: 'APPROVED', updatedAt: '2026-09-30T00:00:00.000Z' },
      ),
    ).toEqual({ open: true });
  });
});
