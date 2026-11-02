import type { PublicLot } from '@bidplace/contracts';

import { apiErrorCodeMessage } from '../../lib/api-error-messages';
import { formatMoney } from '../../lib/money';

export const LOT_POLL_LIVE_MS = 10_000;
export const LOT_POLL_FINAL_MS = 3_000;
const FINAL_WINDOW_MS = 120_000;
// setInterval stores the delay as a signed 32-bit int; a larger value fires immediately.
const LOT_POLL_MAX_MS = 2_147_483_647;
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const minskStamp = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Europe/Minsk',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export type LotPhase =
  | 'portfolio'
  | 'fixed-live'
  | 'auction-scheduled'
  | 'auction-live'
  | 'awaiting-close'
  | 'reserved'
  | 'sold';

export type LotActionOwner = 'task-4' | 'task-5' | 'task-7' | 'auth';

export type LotAction = {
  kind:
    | 'buy'
    | 'bid'
    | 'sign-in'
    | 'verify-email'
    | 'contacts'
    | 'cancel-lot';
  enabled: boolean;
  reason: string | null;
  owner: LotActionOwner;
};

export type LotPresentation = {
  phase: LotPhase;
  priceCaption: string | null;
  priceLabel: string | null;
  bidLabel: string | null;
  scheduleLabel: string | null;
  timerLabel: string | null;
  statusLabel: string | null;
  statusTone: 'neutral' | 'accent' | 'success' | null;
  extensionLabel: string | null;
  deal: boolean;
  contactLine: string | null;
  action: LotAction | null;
  authorHint: string | null;
  showsBidHistory: boolean;
  ticking: boolean;
};

const EXTENSION_LABEL = 'Продлено на минуту: ставка в последние секунды';
// Local ruling: the brief asks for a short hint and does not set a duration.
export const LOT_EXTENSION_HINT_MS = 5_000;
const CLOSE_LABEL = 'Аукцион завершён, подводим итоги';
const UNKNOWN_BLOCK = 'Действие сейчас недоступно.';

export function syncedNowMs(input: {
  serverNow: string;
  dataUpdatedAt: number;
  deviceNow: number;
}): number {
  return Date.parse(input.serverNow) + (input.deviceNow - input.dataUpdatedAt);
}

export function lotExtensionLabel(
  previous: { id: string; endsAt: string | null } | null,
  next: PublicLot,
): string | null {
  if (!previous || previous.id !== next.id || !previous.endsAt || !next.endsAt) {
    return null;
  }
  return Date.parse(next.endsAt) > Date.parse(previous.endsAt)
    ? EXTENSION_LABEL
    : null;
}

export function lotPollIntervalMs(input: {
  active: boolean;
  lot: PublicLot | null | undefined;
  syncedNowMs: number | null;
}): number | false {
  if (!input.active || !input.lot) return false;
  const lot = input.lot;
  if (lot.mark === 'RESERVED' || lot.mark === 'SOLD') return false;
  if (lot.effectiveStatus === 'CANCELLED' || lot.effectiveStatus === 'ENDED') {
    return false;
  }
  const synced = input.syncedNowMs ?? Date.parse(lot.serverNow);
  if (lot.effectiveStatus === 'SCHEDULED') {
    const until = Date.parse(lot.startsAt) - synced;
    if (until <= 0) return LOT_POLL_LIVE_MS;
    return Math.min(Math.max(until, 1_000), LOT_POLL_MAX_MS);
  }
  if (lot.effectiveStatus === 'AWAITING_CLOSE') return LOT_POLL_FINAL_MS;
  if (lot.effectiveStatus !== 'LIVE') return false;
  if (lot.type === 'AUCTION' && lot.endsAt) {
    const remaining = Date.parse(lot.endsAt) - synced;
    if (remaining <= FINAL_WINDOW_MS) return LOT_POLL_FINAL_MS;
  }
  return LOT_POLL_LIVE_MS;
}

export function presentLot(input: {
  lot: PublicLot;
  syncedNowMs: number;
  extensionUntil?: number | null;
  nowMs?: number;
}): LotPresentation {
  const phase = phaseOf(input.lot, input.syncedNowMs);
  const price = priceOf(input.lot, phase);
  const action = actionOf(input.lot, phase);
  const deal = phase !== 'portfolio';
  return {
    phase,
    priceCaption: price.caption,
    priceLabel: price.label,
    bidLabel:
      input.lot.type === 'AUCTION' &&
      (phase === 'auction-live' || phase === 'auction-scheduled')
        ? bidLabel(input.lot.bidCount)
        : null,
    scheduleLabel:
      phase === 'auction-scheduled' ? scheduleLabel(input.lot.startsAt) : null,
    timerLabel:
      phase === 'auction-live' && input.lot.endsAt
        ? formatRemaining(Date.parse(input.lot.endsAt) - input.syncedNowMs)
        : null,
    statusLabel: statusLabel(input.lot, phase),
    statusTone: statusTone(phase, input.lot),
    extensionLabel:
      input.extensionUntil != null &&
      (input.nowMs ?? 0) < input.extensionUntil &&
      phase === 'auction-live'
        ? EXTENSION_LABEL
        : null,
    deal,
    contactLine: deal
      ? `Автор свяжется в течение ${hoursPhrase(input.lot.contactWindowHours)}`
      : null,
    action,
    authorHint: action?.kind === 'cancel-lot' && !action.enabled
      ? action.reason
      : null,
    showsBidHistory: phase === 'auction-live',
    ticking: phase === 'auction-live',
  };
}

export function lotSaleOpen(view: LotPresentation | null): boolean {
  return view?.deal === true;
}

function phaseOf(lot: PublicLot, syncedNowMs: number): LotPhase {
  if (lot.mark === 'SOLD') return 'sold';
  if (lot.mark === 'RESERVED') return 'reserved';
  if (lot.effectiveStatus === 'CANCELLED' || lot.effectiveStatus === 'ENDED') {
    return 'portfolio';
  }
  if (
    lot.type === 'AUCTION' &&
    lot.endsAt !== null &&
    syncedNowMs >= Date.parse(lot.endsAt) &&
    (lot.effectiveStatus === 'LIVE' || lot.effectiveStatus === 'AWAITING_CLOSE')
  ) {
    return 'awaiting-close';
  }
  if (lot.effectiveStatus === 'AWAITING_CLOSE') return 'awaiting-close';
  if (lot.effectiveStatus === 'SCHEDULED') return 'auction-scheduled';
  if (lot.effectiveStatus === 'LIVE' && lot.type === 'FIXED') return 'fixed-live';
  if (lot.effectiveStatus === 'LIVE' && lot.type === 'AUCTION') {
    return 'auction-live';
  }
  return 'portfolio';
}

function priceOf(
  lot: PublicLot,
  phase: LotPhase,
): { caption: string | null; label: string | null } {
  if (phase === 'portfolio') return { caption: null, label: null };
  if (lot.type === 'AUCTION' && lot.bidCount === 0) {
    return {
      caption: 'Начальная цена',
      label:
        lot.minimumBidMinor === null
          ? null
          : formatMoney(lot.minimumBidMinor, lot.currency),
    };
  }
  if (lot.priceMinor === null) return { caption: null, label: null };
  return {
    caption: phase === 'auction-live' ? 'Текущая цена' : 'Цена',
    label: formatMoney(lot.priceMinor, lot.currency),
  };
}

function actionOf(lot: PublicLot, phase: LotPhase): LotAction | null {
  if (phase === 'portfolio' || phase === 'reserved' || phase === 'sold') {
    return null;
  }
  if (lot.viewer?.role === 'seller') {
    const locked = lot.type === 'AUCTION' && lot.bidCount > 0;
    return {
      kind: 'cancel-lot',
      enabled: !locked,
      reason: locked ? 'Аукцион со ставками снять нельзя.' : null,
      owner: 'task-5',
    };
  }
  if (phase === 'awaiting-close' || phase === 'auction-scheduled') return null;
  if (lot.viewer === null) {
    return { kind: 'sign-in', enabled: true, reason: null, owner: 'auth' };
  }
  const code = lot.viewer.blockedReason;
  if (code === 'EMAIL_VERIFICATION_REQUIRED') {
    return { kind: 'verify-email', enabled: true, reason: null, owner: 'auth' };
  }
  if (code === 'BUYER_CONTACTS_REQUIRED') {
    return {
      kind: 'contacts',
      enabled: true,
      reason: apiErrorCodeMessage(code) ?? UNKNOWN_BLOCK,
      owner: 'task-7',
    };
  }
  const kind = lot.type === 'FIXED' ? 'buy' : 'bid';
  if (code === null) {
    return { kind, enabled: true, reason: null, owner: 'task-4' };
  }
  return {
    kind,
    enabled: false,
    reason: blockReason(code),
    owner: 'task-4',
  };
}

function blockReason(code: string): string {
  return apiErrorCodeMessage(code) ?? UNKNOWN_BLOCK;
}

function statusLabel(lot: PublicLot, phase: LotPhase): string | null {
  if (phase === 'sold') return 'Продано';
  if (phase === 'reserved') return 'Забронировано';
  if (phase === 'awaiting-close') return CLOSE_LABEL;
  if (phase === 'auction-live' && lot.viewer?.isLeading) {
    return 'Ваша ставка лидирует';
  }
  return null;
}

function statusTone(
  phase: LotPhase,
  lot: PublicLot,
): LotPresentation['statusTone'] {
  if (phase === 'sold') return 'success';
  if (phase === 'reserved' || phase === 'awaiting-close') return 'neutral';
  if (phase === 'auction-live' && lot.viewer?.isLeading) return 'accent';
  return null;
}

function scheduleLabel(startsAt: string): string {
  const parts = Object.fromEntries(
    minskStamp.formatToParts(new Date(startsAt)).map((part) => [part.type, part.value]),
  );
  return `Аукцион начнётся ${parts.day}.${parts.month} в ${parts.hour}:${parts.minute}`;
}

function formatRemaining(ms: number): string | null {
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  if (ms < DAY_MS) {
    const hours = Math.floor(ms / HOUR_MS);
    const minutes = Math.floor((ms % HOUR_MS) / 60_000);
    return `${hours} ч ${minutes} мин`;
  }
  const days = Math.floor(ms / DAY_MS);
  const hours = Math.floor((ms % DAY_MS) / HOUR_MS);
  return `осталось ${days} д ${hours} ч`;
}

function bidLabel(count: number): string {
  if (count === 0) return 'ставок нет';
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? 'ставка'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? 'ставки'
        : 'ставок';
  return `${count} ${word}`;
}

function hoursPhrase(hours: number): string {
  const mod10 = hours % 10;
  const mod100 = hours % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? 'час'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? 'часа'
        : 'часов';
  return `${hours} ${word}`;
}
