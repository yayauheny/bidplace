import { describe, expect, it } from 'vitest';

import { isTickCronConfigured } from './notification-admin.controller';
import { AppException } from '../core/errors';
import {
  NOTIFICATION_KINDS,
  assertNotificationPayload,
  renderNotification,
  resolveDeliveryFailure,
  withNotificationSendTimeout,
  type NotificationKind,
} from './notification-outbox';

const CONTACTS = {
  phone: '+375291112233',
  email: 'other@party.test',
  telegram: '@secret_handle',
  instagram: 'secret_ig',
  vk: 'https://vk.com/secret',
  buyerEmail: 'buyer-secret@party.test',
  sellerPhone: '+375290000000',
  reportText: 'Жалоба: перезвоните +375291112233',
} as const;

const PAYLOAD = {
  orderPublicId: 'ordrpublic0001',
  workTitle: 'Керамика',
  comment: 'Заберу сам',
  buyerName: 'Анна',
  sellerName: 'Пётр',
  dealCode: '123456',
  amountMinor: 150050,
  currency: 'BYN',
  completedAt: '2026-10-30',
  failReason: 'BUYER_REFUSED',
  listingType: 'FIXED',
  ...CONTACTS,
};

describe('notification templates', () => {
  it.each(NOTIFICATION_KINDS)(
    '%s avoids gambling words, links the order, and omits the other party contacts',
    (kind: NotificationKind) => {
      const message = renderNotification(kind, PAYLOAD);
      const haystack = `${message.subject}\n${message.text}`.toLowerCase();

      expect(haystack).not.toContain('выигр');
      expect(haystack).not.toContain('приз');
      expect(haystack).not.toContain('розыгрыш');
      expect(message.text).toContain('/account/orders/ordrpublic0001');
      expect(message.subject).not.toMatch(/[\r\n]/);

      for (const secret of Object.values(CONTACTS)) {
        expect(message.subject).not.toContain(secret);
        expect(message.text).not.toContain(secret);
      }
    },
  );

  it('renders the deal receipt without calling it a cash receipt', () => {
    const message = renderNotification('DEAL_COMPLETED', PAYLOAD);

    expect(message.text).toContain('Номер заказа: ordrpublic0001');
    expect(message.text).toContain('Код сделки: 123456');
    expect(message.text).toContain('Работа: Керамика');
    expect(message.text).toContain('Автор: Пётр');
    expect(message.text).toContain('Покупатель: Анна');
    expect(message.text).toContain('1500.50 BYN');
    expect(message.text).toContain('2026-10-30');
    expect(message.text).toContain('Не является кассовым чеком.');
    expect(message.text).not.toContain(CONTACTS.email);
    expect(message.text).not.toContain(CONTACTS.phone);
  });

  it('says a fixed-price failure puts the work on sale again and hides a report body', () => {
    const failed = renderNotification('ORDER_FAILED', PAYLOAD);
    const reported = renderNotification('ORDER_REPORTED', PAYLOAD);

    expect(failed.text).toContain('Работа снова в продаже.');
    expect(failed.text).not.toContain(CONTACTS.phone);
    expect(reported.text).not.toContain(CONTACTS.reportText);
    expect(reported.text).not.toContain('+375291112233');
  });

  it('strips CR/LF from the title, comment, and name so the subject stays one line', () => {
    const message = renderNotification('LISTING_SOLD', {
      workTitle: 'Ваза\r\nBcc: a@b.c',
      comment: 'Комментарий\r\nBcc: a@b.c',
      buyerName: 'Имя\r\nBcc: a@b.c',
      sellerName: 'Автор\r\nBcc: a@b.c',
      orderPublicId: 'ordrpublic0001',
    });

    expect(message.subject).not.toMatch(/[\r\n]/);
    expect(message.text).not.toMatch(/\r/);
    expect(`${message.subject}\n${message.text}`).not.toMatch(/\nBcc:/);
    expect(message.text).toContain('/account/orders/ordrpublic0001');
    expect(message).not.toHaveProperty('bcc');
  });
});

describe('tick cron configuration', () => {
  it('treats a blank schedule as off', () => {
    expect(isTickCronConfigured(undefined)).toBe(false);
    expect(isTickCronConfigured('')).toBe(false);
    expect(isTickCronConfigured('   ')).toBe(false);
    expect(isTickCronConfigured('*/5 * * * *')).toBe(true);
  });
});

describe('notification payload contract', () => {
  it.each([
    ['CONFIRM_DEAL_REMINDER', { orderPublicId: 'ordrpublic0001' }],
    ['OUTBID', { workTitle: 'Ваза' }],
    ['ORDER_REPORTED', { orderPublicId: 'ordrpublic0001' }],
    ['CONTACTS_CHANGED', {}],
  ] as const)(
    'requires a discriminator for %s',
    (kind, payload) => {
      expect(() => assertNotificationPayload(kind, payload)).toThrow(
        AppException,
      );
    },
  );

  it.each([
    [
      'CONFIRM_DEAL_REMINDER',
      { orderPublicId: 'ordrpublic0001', slot: '24h' },
    ],
    [
      'CONFIRM_DEAL_REMINDER',
      { orderPublicId: 'ordrpublic0001', slot: '48h' },
    ],
    ['OUTBID', { bidId: '6f0c1c4a-6c3e-4b7a-9c1d-2a9e0f5b7c31' }],
    [
      'ORDER_REPORTED',
      {
        orderPublicId: 'ordrpublic0001',
        reportId: '6f0c1c4a-6c3e-4b7a-9c1d-2a9e0f5b7c32',
      },
    ],
    [
      'CONTACTS_CHANGED',
      { eventId: '6f0c1c4a-6c3e-4b7a-9c1d-2a9e0f5b7c33' },
    ],
  ] as const)('accepts %s when its discriminator is present', (kind, payload) => {
    expect(() => assertNotificationPayload(kind, payload)).not.toThrow();
  });

  it('rejects a contact field and a reminder slot outside 24h and 48h', () => {
    expect(() =>
      assertNotificationPayload('BID_WON', {
        orderPublicId: 'ordrpublic0001',
        phone: '+375291112233',
      }),
    ).toThrow(AppException);
    expect(() =>
      assertNotificationPayload('CONFIRM_DEAL_REMINDER', {
        orderPublicId: 'ordrpublic0001',
        slot: '72h',
      }),
    ).toThrow(AppException);
  });

  it('accepts an order public id that includes the PublicIdService alphabet', () => {
    const orderPublicId = 'aB3_d-E9f0g';
    expect(() =>
      assertNotificationPayload('PURCHASED', { orderPublicId }),
    ).not.toThrow();
    expect(renderNotification('PURCHASED', { orderPublicId }).text).toContain(
      `/account/orders/${orderPublicId}`,
    );
  });
});

describe('notification delivery outcome', () => {
  it('retries an unknown transport failure with a delay until the tenth attempt', () => {
    expect(resolveDeliveryFailure(new Error('connect ECONNRESET'), 1)).toEqual({
      outcome: 'retry',
      delaySeconds: 60,
    });
    const second = resolveDeliveryFailure(new Error('connect ECONNRESET'), 2);
    expect(second.outcome).toBe('retry');
    if (second.outcome === 'retry') {
      expect(second.delaySeconds).toBeGreaterThan(60);
    }
    expect(resolveDeliveryFailure(new Error('connect ECONNRESET'), 10)).toEqual({
      outcome: 'dead',
    });
  });

  it('bounds a hung send', async () => {
    await expect(
      withNotificationSendTimeout(new Promise(() => undefined), 30),
    ).rejects.toThrow('notification send timed out');
  });

  it('treats a definite SMTP reject as dead without further retries', () => {
    expect(resolveDeliveryFailure({ responseCode: 550 }, 0)).toEqual({
      outcome: 'dead',
    });
    expect(
      resolveDeliveryFailure(
        new Error('Mail recipient must be a single email address'),
        2,
      ),
    ).toEqual({ outcome: 'dead' });
  });
});
