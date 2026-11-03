import {
  COMMERCE_LIMITS,
  type OrderDetail,
  type OrderSummary,
} from '@bidplace/contracts';

const DAY_MS = 24 * 60 * 60 * 1000;
const REPORT_WINDOW_MS = COMMERCE_LIMITS.reportWindowDays * DAY_MS;

const minskStamp = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Europe/Minsk',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export const FAIL_REASON_LABEL = {
  BUYER_REFUSED: 'покупатель отказался',
  BUYER_NO_CONTACT: 'не вышел на связь',
  BUYER_INVALID_CONTACTS: 'неверные контакты',
  SELLER_REFUSED: 'я отказываюсь продавать',
  OFFER_DECLINED: 'предложение отклонено',
  OFFER_EXPIRED: 'время ответа вышло',
  ADMIN_CANCELLED: 'отменено администратором',
} as const;

export const REPORT_REASON_LABEL = {
  NO_CONTACT: 'Нет связи',
  TERMS_CHANGED: 'Условия изменились',
  NOT_AS_DESCRIBED: 'Не соответствует описанию',
  NOT_HANDED_OVER: 'Работу не передали',
  FRAUD: 'Обман',
  OTHER: 'Другое',
} as const;

export const ATTENTION_LABEL = {
  OFFER: 'Предложение ждёт ответа',
  ACTIVE_ORDER: 'Отметьте, состоялась ли сделка',
  OPEN_REPORT: 'По заказу открыта жалоба',
  AUCTION_CHOICE: 'Выберите, что делать с аукционом',
  CONTACTS_REQUIRED: 'Нужны контакты для сделок',
} as const;

const SELLER_FAIL_REASONS = [
  'BUYER_REFUSED',
  'BUYER_NO_CONTACT',
  'BUYER_INVALID_CONTACTS',
  'SELLER_REFUSED',
] as const;

const NEXT_OFFER_REASONS = new Set([
  'BUYER_REFUSED',
  'BUYER_NO_CONTACT',
  'BUYER_INVALID_CONTACTS',
  'OFFER_DECLINED',
  'OFFER_EXPIRED',
]);

export type SellerFailReason = (typeof SELLER_FAIL_REASONS)[number];

export type OrderActionModel = {
  accept: boolean;
  declineOffer: boolean;
  buyerRefuse: boolean;
  complete: boolean;
  offerNext: boolean;
  relist: boolean;
  report: boolean;
  resaleNote: boolean;
  paymentWarning: boolean;
  failReasons: Array<{
    reason: SellerFailReason;
    enabled: boolean;
    hint: string | null;
  }>;
};

export function formatOrderStamp(iso: string): string {
  const parts = Object.fromEntries(
    minskStamp.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  );
  return `${parts.day}.${parts.month}.${parts.year} ${parts.hour}:${parts.minute}`;
}

export function orderStatusLabel(order: {
  status: OrderSummary['status'];
  failReason?: OrderDetail['failReason'];
}): string {
  if (order.status === 'OFFERED') return 'Предложено';
  if (order.status === 'ACTIVE') return 'Ждёт связи';
  if (order.status === 'COMPLETED') return 'Состоялась';
  const reason =
    order.failReason && order.failReason in FAIL_REASON_LABEL
      ? FAIL_REASON_LABEL[order.failReason]
      : null;
  return reason ? `Не состоялась: ${reason}` : 'Не состоялась';
}

export function orderSourceLabel(source: OrderSummary['source']): string {
  if (source === 'FIXED_PURCHASE') return 'Фиксированная цена';
  if (source === 'SECOND_CHANCE') return 'Предложение следующему';
  return 'Аукцион';
}

export function orderTiming(order: OrderSummary & {
  offerExpiresAt?: string | null;
  contactDeadlineAt?: string | null;
  status: OrderSummary['status'];
}): string | null {
  if (order.status === 'OFFERED' && order.offerExpiresAt) {
    return `Ответьте до ${formatOrderStamp(order.offerExpiresAt)}`;
  }
  if (order.status === 'ACTIVE' && order.contactDeadlineAt) {
    return `Срок связи до ${formatOrderStamp(order.contactDeadlineAt)}`;
  }
  return null;
}

export function orderActions(
  order: OrderDetail,
  nowMs: number,
  access: { canStartSale: boolean } = { canStartSale: true },
): OrderActionModel {
  const buyer = order.role === 'buyer';
  const seller = order.role === 'seller';
  const auction =
    order.source === 'AUCTION_WIN' || order.source === 'SECOND_CHANCE';
  const contactOpen =
    order.contactDeadlineAt !== null &&
    nowMs >= Date.parse(order.contactDeadlineAt);
  const contactHint =
    order.contactDeadlineAt === null
      ? null
      : `Можно с ${formatOrderStamp(order.contactDeadlineAt)}`;
  return {
    accept: buyer && order.status === 'OFFERED' && !offerExpired(order, nowMs),
    declineOffer: buyer && order.status === 'OFFERED',
    buyerRefuse: buyer && order.status === 'ACTIVE',
    complete: seller && order.status === 'ACTIVE',
    offerNext:
      access.canStartSale &&
      seller &&
      order.status === 'FAILED' &&
      auction &&
      order.failReason !== null &&
      NEXT_OFFER_REASONS.has(order.failReason),
    relist: access.canStartSale && seller && order.status === 'FAILED' && auction,
    report: (buyer || seller) && reportOpen(order, nowMs),
    resaleNote: seller && order.status === 'FAILED' && order.source === 'FIXED_PURCHASE',
    paymentWarning: buyer && order.status === 'ACTIVE',
    failReasons:
      seller && order.status === 'ACTIVE'
        ? SELLER_FAIL_REASONS.map((reason) => {
            const delayed =
              reason === 'BUYER_NO_CONTACT' || reason === 'BUYER_INVALID_CONTACTS';
            return {
              reason,
              enabled: delayed ? contactOpen : true,
              hint: delayed && !contactOpen ? contactHint : null,
            };
          })
        : [],
  };
}

export function orderContactLinks(
  contacts: NonNullable<OrderDetail['buyerContacts']>,
): Array<{ label: string; href: string }> {
  const links = [{ label: contacts.email, href: `mailto:${contacts.email}` }];
  if (contacts.phone) {
    links.push({ label: contacts.phone, href: `tel:${contacts.phone}` });
  }
  const telegram = socialHref(contacts.telegram, 'https://t.me/');
  if (telegram && contacts.telegram) {
    links.push({ label: contacts.telegram, href: telegram });
  }
  const instagram = socialHref(contacts.instagram, 'https://instagram.com/');
  if (instagram && contacts.instagram) {
    links.push({ label: contacts.instagram, href: instagram });
  }
  const vk = socialHref(contacts.vk, 'https://vk.com/');
  if (vk && contacts.vk) links.push({ label: contacts.vk, href: vk });
  return links;
}

function offerExpired(order: OrderDetail, nowMs: number) {
  return order.offerExpiresAt !== null && nowMs >= Date.parse(order.offerExpiresAt);
}

function reportOpen(order: OrderDetail, nowMs: number) {
  if (order.status === 'ACTIVE') return true;
  if (order.status !== 'COMPLETED' && order.status !== 'FAILED') return false;
  const closedAt = order.status === 'COMPLETED' ? order.completedAt : order.failedAt;
  if (!closedAt) return false;
  return nowMs - Date.parse(closedAt) <= REPORT_WINDOW_MS;
}

function socialHref(value: string | null, prefix: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^https:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, '');
  if (!/^[A-Za-z0-9_.]+$/.test(handle)) return null;
  return `${prefix}${handle}`;
}
