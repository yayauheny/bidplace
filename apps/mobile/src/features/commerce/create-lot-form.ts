import {
  COMMERCE_LIMITS,
  bidStepMinor,
  createListingRequestSchema,
  type CreateListingRequest,
  type Currency,
} from '@bidplace/contracts';

import { parseMoneyInput } from '../../lib/money';

export const CONTACT_WINDOW_HOURS = COMMERCE_LIMITS.contactWindowHours;
export const AUCTION_DAY_CHIPS = [1, 3, 7, 14] as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const MINSK_OFFSET_MS = 3 * 60 * 60 * 1000;

const minskStamp = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Europe/Minsk',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export type CreateLotDraft = {
  type: 'FIXED' | 'AUCTION';
  currency: Currency;
  amountText: string;
  contactWindowHours: (typeof CONTACT_WINDOW_HOURS)[number];
  startMode: 'now' | 'scheduled';
  startDate: string;
  startTime: string;
  durationDays: (typeof AUCTION_DAY_CHIPS)[number] | null;
  customDaysText: string;
};

export function initialCreateLotDraft(): CreateLotDraft {
  return {
    type: 'FIXED',
    currency: 'BYN',
    amountText: '',
    contactWindowHours: COMMERCE_LIMITS.defaultContactWindowHours,
    startMode: 'now',
    startDate: '',
    startTime: '12:00',
    durationDays: 7,
    customDaysText: '',
  };
}

export function cabinetListOffer(input: {
  status: string;
  isSuspended: boolean;
}): { enabled: boolean; reason: string | null } {
  if (input.isSuspended) {
    return { enabled: false, reason: 'Аккаунт автора приостановлен.' };
  }
  if (input.status === 'APPROVED') return { enabled: true, reason: null };
  if (input.status === 'ARCHIVED') {
    return { enabled: false, reason: 'Скрытую работу нельзя выставить.' };
  }
  if (input.status === 'REJECTED') {
    return { enabled: false, reason: 'Отклонённую работу нельзя выставить.' };
  }
  if (
    input.status === 'PENDING_REVIEW' ||
    input.status === 'CHANGES_REQUESTED'
  ) {
    return { enabled: false, reason: 'Работа ещё не одобрена.' };
  }
  return { enabled: false, reason: 'Сначала опубликуйте работу.' };
}

export function formatListingStamp(iso: string): string {
  const parts = Object.fromEntries(
    minskStamp
      .formatToParts(new Date(iso))
      .map((part) => [part.type, part.value]),
  );
  return `${parts.day}.${parts.month}.${parts.year} ${parts.hour}:${parts.minute}`;
}

export function createLotRequest(
  draft: CreateLotDraft,
  nowMs: number,
):
  | { ok: true; value: CreateListingRequest; endsLabel: string | null }
  | { ok: false; message: string } {
  const amount = parseMoneyInput(draft.amountText, draft.currency);
  if (amount === null || amount <= 0) {
    return { ok: false, message: 'Укажите цену больше нуля.' };
  }
  const startsAt = resolveStartsAt(draft, nowMs);
  if (!startsAt.ok) return startsAt;
  const days = draft.type === 'AUCTION' ? durationDays(draft) : null;
  if (draft.type === 'AUCTION' && days === null) {
    return { ok: false, message: 'Длительность аукциона — от 1 до 14 дней.' };
  }
  if (
    draft.type === 'AUCTION' &&
    amount % bidStepMinor(draft.currency, amount) !== 0
  ) {
    return {
      ok: false,
      message: 'Стартовая цена должна быть кратна шагу ставки.',
    };
  }
  const endsAt =
    draft.type === 'AUCTION' && days !== null
      ? new Date(Date.parse(startsAt.value) + days * DAY_MS).toISOString()
      : null;
  const value =
    draft.type === 'FIXED'
      ? {
          type: 'FIXED' as const,
          priceMinor: amount,
          currency: draft.currency,
          startsAt: new Date(nowMs - 5_000).toISOString(),
          contactWindowHours: draft.contactWindowHours,
        }
      : {
          type: 'AUCTION' as const,
          startPriceMinor: amount,
          currency: draft.currency,
          startsAt: startsAt.value,
          endsAt: endsAt ?? startsAt.value,
          contactWindowHours: draft.contactWindowHours,
        };
  const parsed = createListingRequestSchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, message: schemaMessage(parsed.error.issues[0]?.message) };
  }
  return {
    ok: true,
    value: parsed.data,
    endsLabel: endsAt ? formatListingStamp(endsAt) : null,
  };
}

function durationDays(draft: CreateLotDraft): number | null {
  if (draft.durationDays !== null) return draft.durationDays;
  if (!/^\d{1,2}$/.test(draft.customDaysText.trim())) return null;
  const days = Number(draft.customDaysText);
  if (days < COMMERCE_LIMITS.auctionMinDays || days > COMMERCE_LIMITS.auctionMaxDays) {
    return null;
  }
  return days;
}

function resolveStartsAt(
  draft: CreateLotDraft,
  nowMs: number,
): { ok: true; value: string } | { ok: false; message: string } {
  if (draft.type === 'FIXED' || draft.startMode === 'now') {
    return { ok: true, value: new Date(nowMs).toISOString() };
  }
  const date = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(draft.startDate.trim());
  const time = /^(\d{2}):(\d{2})$/.exec(draft.startTime.trim());
  if (!date || !time) {
    return { ok: false, message: 'Укажите дату и время начала.' };
  }
  const day = Number(date[1]);
  const month = Number(date[2]);
  const year = Number(date[3]);
  const hour = Number(time[1]);
  const minute = Number(time[2]);
  if (hour > 23 || minute > 59) {
    return { ok: false, message: 'Укажите дату и время начала.' };
  }
  const utc = Date.UTC(year, month - 1, day, hour, minute) - MINSK_OFFSET_MS;
  const back = new Date(utc + MINSK_OFFSET_MS);
  if (
    back.getUTCFullYear() !== year ||
    back.getUTCMonth() !== month - 1 ||
    back.getUTCDate() !== day
  ) {
    return { ok: false, message: 'Укажите существующую дату.' };
  }
  if (utc < nowMs - 60_000) {
    return { ok: false, message: 'Начало уже прошло.' };
  }
  return { ok: true, value: new Date(utc).toISOString() };
}

function schemaMessage(message: string | undefined): string {
  if (message === 'startsAt is further than 30 days') {
    return 'Начало не дальше 30 дней.';
  }
  if (message === 'Auction length must be from 1 to 14 days') {
    return 'Длительность аукциона — от 1 до 14 дней.';
  }
  if (message === 'Start price must be a multiple of the bid step') {
    return 'Стартовая цена должна быть кратна шагу ставки.';
  }
  return 'Проверьте условия лота.';
}
