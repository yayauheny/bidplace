import { describe, expect, it } from 'vitest';

import {
  canOwnerEditProduct,
  ownerModerationReasonNotice,
  ownerProductSubmitLabel,
} from './product-draft-state';

describe('product draft owner recovery', () => {
  it('hydrates rejected and correction drafts as editable and keeps approved products locked', () => {
    expect(canOwnerEditProduct(undefined)).toBe(true);
    expect(canOwnerEditProduct('DRAFT')).toBe(true);
    expect(canOwnerEditProduct('CHANGES_REQUESTED')).toBe(true);
    expect(canOwnerEditProduct('REJECTED')).toBe(true);
    expect(canOwnerEditProduct('PENDING_REVIEW')).toBe(false);
    expect(canOwnerEditProduct('APPROVED')).toBe(false);
    expect(canOwnerEditProduct('ARCHIVED')).toBe(false);
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
});
