import type { AnalyticsAttribution } from '@bidplace/contracts';

import {
  getStoredString,
  removeStoredString,
  setStoredString,
} from './storage';

export const FIRST_TOUCH_KEY = 'bidplace.analytics.firstTouch';

export type StoredFirstTouch = AnalyticsAttribution & {
  capturedAt: string;
};

function trimField(value: string | null | undefined): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readQueryParam(
  params: URLSearchParams,
  key: string,
): string | undefined {
  return trimField(params.get(key));
}

export function parseAttributionFromUrl(
  urlOrQuery: string,
): AnalyticsAttribution {
  const trimmed = urlOrQuery.trim();
  if (!trimmed) {
    return {};
  }

  let pathname: string | undefined;
  let search = trimmed;
  let referrer: string | undefined;

  try {
    const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed);
    const url = new URL(hasScheme ? trimmed : `https://bidplace.local${trimmed.startsWith('/') ? trimmed : `/?${trimmed}`}`);
    pathname = trimField(url.pathname);
    search = url.search.startsWith('?') ? url.search.slice(1) : url.search;
    referrer = trimField(url.searchParams.get('referrer'));
  } catch {
    if (trimmed.startsWith('?')) {
      search = trimmed.slice(1);
    } else if (trimmed.includes('=')) {
      search = trimmed;
    } else {
      return {};
    }
  }

  const params = new URLSearchParams(search);
  const attribution: AnalyticsAttribution = {};

  const source = readQueryParam(params, 'utm_source');
  const medium = readQueryParam(params, 'utm_medium');
  const campaign = readQueryParam(params, 'utm_campaign');
  const content = readQueryParam(params, 'utm_content');
  const landingPath = pathname && pathname !== '/' ? pathname : undefined;
  const referrerValue =
    referrer ?? readQueryParam(params, 'referrer');

  if (source) attribution.source = source;
  if (medium) attribution.medium = medium;
  if (campaign) attribution.campaign = campaign;
  if (content) attribution.content = content;
  if (referrerValue) attribution.referrer = referrerValue;
  if (landingPath) attribution.landingPath = landingPath;

  return attribution;
}

function hasAttributionFields(partial: AnalyticsAttribution): boolean {
  return Boolean(
    partial.source ||
      partial.medium ||
      partial.campaign ||
      partial.content ||
      partial.referrer ||
      partial.landingPath,
  );
}

export async function getFirstTouch(): Promise<StoredFirstTouch | null> {
  const raw = await getStoredString(FIRST_TOUCH_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredFirstTouch;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof parsed.capturedAt !== 'string'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function captureFirstTouch(
  partial: AnalyticsAttribution,
): Promise<StoredFirstTouch | null> {
  const existing = await getFirstTouch();
  if (existing) {
    return existing;
  }

  if (!hasAttributionFields(partial)) {
    return null;
  }

  const saved: StoredFirstTouch = {
    ...partial,
    capturedAt: new Date().toISOString(),
  };
  await setStoredString(FIRST_TOUCH_KEY, JSON.stringify(saved));
  return saved;
}

export async function resetFirstTouchForTests(): Promise<void> {
  await removeStoredString(FIRST_TOUCH_KEY);
}
