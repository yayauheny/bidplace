import { ApiClientError, type ApiClient } from '@bidplace/api-client';
import { describe, expect, it, vi } from 'vitest';

import {
  banUserByEmail,
  commerceActionMessage,
  orderOutcomeBody,
  releaseHoldBody,
  removeListingBody,
  reportQueueItem,
  requiredReason,
  resolveReportBody,
} from './admin-commerce-actions';

describe('admin commerce actions', () => {
  it('refuses an empty reason and a rejected report with a fault side', () => {
    expect(requiredReason('  ')).toBeNull();
    expect(requiredReason('Потерял телефон')).toBe('Потерял телефон');
    expect(releaseHoldBody(' ')).toBeNull();
    expect(removeListingBody('Снять')).toEqual({ reason: 'Снять' });
    expect(
      resolveReportBody({
        status: 'REJECTED',
        faultSide: 'BUYER',
        adminNote: 'Нет нарушения',
      }),
    ).toEqual({ status: 'REJECTED', adminNote: 'Нет нарушения' });
    expect(
      resolveReportBody({
        status: 'UPHELD',
        faultSide: '',
        adminNote: 'Вина покупателя',
      }),
    ).toBeNull();
    expect(
      resolveReportBody({
        status: 'UPHELD',
        faultSide: 'BUYER',
        adminNote: 'Вина покупателя',
      }),
    ).toEqual({
      status: 'UPHELD',
      faultSide: 'BUYER',
      adminNote: 'Вина покупателя',
    });
    expect(
      orderOutcomeBody({ to: 'FAILED', failReason: '', reason: 'Отмена' }),
    ).toBeNull();
    expect(
      orderOutcomeBody({
        to: 'COMPLETED',
        failReason: '',
        reason: 'Сделка закрыта',
      }),
    ).toEqual({ to: 'COMPLETED', reason: 'Сделка закрыта' });
  });

  it('keeps deal contacts off the report queue item', () => {
    expect(
      Object.keys(
        reportQueueItem({
          id: '11111111-1111-4111-8111-111111111111',
          orderPublicId: 'orderpublic1',
          reason: 'OTHER',
          status: 'OPEN',
          buyerUserId: '22222222-2222-4222-8222-222222222222',
          sellerUserId: '33333333-3333-4333-8333-333333333333',
          text: 'Жалоба',
        }),
      ),
    ).not.toContain('phone');
  });

  it('names auth, permission, and conflict failures', () => {
    expect(
      commerceActionMessage(
        new ApiClientError('no', { kind: 'unauthorized', status: 401 }),
      ),
    ).toBe('Войдите снова.');
    expect(
      commerceActionMessage(
        new ApiClientError('no', { kind: 'forbidden', status: 403 }),
      ),
    ).toBe('Недостаточно прав.');
    expect(
      commerceActionMessage(
        new ApiClientError('no', { kind: 'conflict', status: 409 }),
      ),
    ).toBe('Запись уже изменилась. Список обновлён.');
  });

  it('does not ban when lookup outlives the originating operation', async () => {
    let resolveLookup: (value: Awaited<ReturnType<ApiClient['admin']['lookupUsers']>>) => void = () => {};
    const lookupUsers = vi.fn<ApiClient['admin']['lookupUsers']>().mockImplementation(() => new Promise((resolve) => { resolveLookup = resolve; }));
    const banUser = vi.fn<ApiClient['commerce']['banUser']>();
    let current = true;
    const pending = banUserByEmail({ admin: { lookupUsers }, commerce: { banUser } }, 'synthetic@example.invalid', 'Synthetic reason', () => current);
    current = false;
    resolveLookup({ users: [{ id: '11111111-1111-4111-8111-111111111111', email: 'synthetic@example.invalid', displayName: null, role: 'user', status: 'active' }] });
    expect(await pending).toBeNull();
    expect(banUser).not.toHaveBeenCalled();
  });

  it('bans the uniquely found user while the originating operation is current', async () => {
    const user = { id: '11111111-1111-4111-8111-111111111111', email: 'synthetic@example.invalid', displayName: null, role: 'user' as const, status: 'active' as const };
    const lookupUsers = vi.fn<ApiClient['admin']['lookupUsers']>().mockResolvedValue({ users: [user] });
    const banUser = vi.fn<ApiClient['commerce']['banUser']>();
    expect(await banUserByEmail({ admin: { lookupUsers }, commerce: { banUser } }, user.email, 'Synthetic reason', () => true)).toBe(true);
    expect(banUser).toHaveBeenCalledWith(user.id, { reason: 'Synthetic reason' });
  });

});
