import type { NotificationKind } from './notification-kinds';

const COPY: Record<NotificationKind, { subject: string; lead: string }> = {
  BID_WON: {
    subject: 'Ваша ставка лучшая',
    lead: 'Ваша ставка лучшая — работа ваша.',
  },
  PURCHASED: {
    subject: 'Работа забронирована',
    lead: 'Вы забронировали работу.',
  },
  LISTING_SOLD: {
    subject: 'Работа забронирована',
    lead: 'Работа забронирована.',
  },
  AUCTION_ENDED: {
    subject: 'Аукцион завершён',
    lead: 'Аукцион завершён.',
  },
  AUCTION_ENDED_NO_BIDS: {
    subject: 'Аукцион завершён',
    lead: 'Аукцион завершён без ставок.',
  },
  OFFER_RECEIVED: {
    subject: 'Вам предлагают работу',
    lead: 'Вам предлагают работу.',
  },
  CONFIRM_DEAL_REMINDER: {
    subject: 'Отметьте, состоялась ли сделка',
    lead: 'Отметьте, состоялась ли сделка.',
  },
  DEAL_COMPLETED: {
    subject: 'Сделка состоялась',
    lead: 'Сделка состоялась.',
  },
  ORDER_FAILED: {
    subject: 'Сделка не состоялась',
    lead: 'Сделка не состоялась.',
  },
  ORDER_REPORTED: {
    subject: 'По вашему заказу открыта жалоба',
    lead: 'По вашему заказу открыта жалоба.',
  },
  LISTING_REMOVED: {
    subject: 'Аукцион остановлен',
    lead: 'Аукцион остановлен администрацией.',
  },
  OUTBID: {
    subject: 'Вашу ставку перебили',
    lead: 'Вашу ставку перебили.',
  },
  CONTACTS_CHANGED: {
    subject: 'Контакты в профиле изменены',
    lead: 'Контакты в профиле изменены.',
  },
};

const FAIL_REASON_TEXT: Record<string, string> = {
  BUYER_REFUSED: 'Покупатель отказался',
  BUYER_NO_CONTACT: 'Покупатель не вышел на связь',
  BUYER_INVALID_CONTACTS: 'Связаться по указанным данным не удалось',
  SELLER_REFUSED: 'Автор отказался',
  OFFER_DECLINED: 'Предложение отклонено',
  OFFER_EXPIRED: 'Срок предложения истёк',
  ADMIN_CANCELLED: 'Заказ отменён администрацией',
};

const COMMENT_KINDS = new Set<NotificationKind>([
  'BID_WON',
  'PURCHASED',
  'LISTING_SOLD',
  'OFFER_RECEIVED',
  'DEAL_COMPLETED',
  'ORDER_FAILED',
]);

function singleLine(value: string): string {
  return value.replace(/[\r\n]/g, '');
}

function textField(
  payload: Record<string, string | number>,
  key: string,
): string | undefined {
  const value = payload[key];
  if (typeof value !== 'string') return undefined;
  const cleaned = singleLine(value);
  return cleaned.length > 0 ? cleaned : undefined;
}

function formatAmount(
  payload: Record<string, string | number>,
): string | undefined {
  const amount = payload.amountMinor;
  const currency = textField(payload, 'currency');
  if (typeof amount !== 'number' || !Number.isInteger(amount) || !currency) {
    return undefined;
  }
  const sign = amount < 0 ? '-' : '';
  const absolute = Math.abs(amount);
  const minor = String(absolute % 100).padStart(2, '0');
  return `${sign}${Math.trunc(absolute / 100)}.${minor} ${currency}`;
}

function orderLink(
  publicId: string,
  origin: string | undefined,
): string | undefined {
  if (!/^[A-Za-z0-9_-]{1,16}$/.test(publicId)) return undefined;
  const path = `/account/orders/${publicId}`;
  if (!origin) return path;
  return `${origin.replace(/\/$/, '')}${path}`;
}

export function renderNotification(
  kind: NotificationKind,
  payload: Record<string, string | number>,
  origin?: string,
): { subject: string; text: string } {
  const copy = COPY[kind];
  const title = textField(payload, 'workTitle');
  const subject = singleLine(title ? `${copy.subject}: ${title}` : copy.subject);
  const lines = [copy.lead];

  if (kind === 'DEAL_COMPLETED') {
    lines.push(
      `Номер заказа: ${textField(payload, 'orderPublicId') ?? ''}`,
      `Код сделки: ${textField(payload, 'dealCode') ?? ''}`,
      `Работа: ${title ?? ''}`,
      `Автор: ${textField(payload, 'sellerName') ?? ''}`,
      `Покупатель: ${textField(payload, 'buyerName') ?? ''}`,
      `Сумма: ${formatAmount(payload) ?? ''}`,
      `Дата: ${textField(payload, 'completedAt') ?? ''}`,
      'Не является кассовым чеком.',
    );
  }

  if (kind === 'ORDER_FAILED') {
    const reason = FAIL_REASON_TEXT[textField(payload, 'failReason') ?? ''];
    if (reason) lines.push(reason);
    if (textField(payload, 'listingType') === 'FIXED') {
      lines.push('Работа снова в продаже.');
    }
  }

  if (COMMENT_KINDS.has(kind)) {
    const comment = textField(payload, 'comment');
    if (comment) lines.push(comment);
  }

  const orderPublicId = textField(payload, 'orderPublicId');
  const link = orderPublicId ? orderLink(orderPublicId, origin) : undefined;
  if (link) lines.push(`Заказ: ${link}`);

  return { subject, text: lines.join('\n') };
}
