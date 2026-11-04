import { ApiClientError } from '@bidplace/api-client';
import {
  userContactsRequestSchema,
  type UserContactsRequest,
  type UserContactsResponse,
} from '@bidplace/contracts';

import { getSafeRedirect, type SafeRedirect } from '../auth/auth-redirect';

const SETTINGS_PATH = '/account/settings' as const;

const FIELD_MESSAGE: Record<string, string> = {
  phone: 'Телефон: + и от 7 до 15 цифр',
  telegram: 'Telegram: @имя или https://t.me/имя',
  instagram: 'Instagram: @имя или ссылка instagram.com',
  vk: 'VK: @имя или ссылка vk.com / vk.ru',
  showToBuyer: 'Переключатель доступен только автору',
};

export type DealContactDraft = {
  phone: string;
  telegram: string;
  instagram: string;
  vk: string;
  showToBuyer: boolean | null;
};

export type DealContactSaveResult =
  | { kind: 'unchanged' }
  | { kind: 'invalid'; field: string; message: string }
  | { kind: 'stale-session' }
  | { kind: 'saved'; contacts: UserContactsResponse }
  | { kind: 'failed'; message: string }
  | { kind: 'dropped' };

const TEXT_FIELDS = ['phone', 'telegram', 'instagram', 'vk'] as const;

export function draftFromContacts(
  loaded: UserContactsResponse,
): DealContactDraft {
  return {
    phone: loaded.phone ?? '',
    telegram: loaded.telegram ?? '',
    instagram: loaded.instagram ?? '',
    vk: loaded.vk ?? '',
    showToBuyer: loaded.showToBuyer,
  };
}

export function dealContactsRedirect(
  rawParam: string | string[] | null | undefined,
): SafeRedirect {
  const raw = Array.isArray(rawParam) ? rawParam[0] : rawParam;
  if (!raw?.trim()) return SETTINGS_PATH;
  const safe = getSafeRedirect(raw);
  if (safe === '/' && raw.trim() !== '/') return SETTINGS_PATH;
  return safe;
}

export function dealContactsLoginPath(redirectTo: SafeRedirect): SafeRedirect {
  const back =
    redirectTo === SETTINGS_PATH
      ? '/account/contacts'
      : `/account/contacts?redirectTo=${encodeURIComponent(redirectTo)}`;
  return getSafeRedirect(back);
}

export function dealContactPatch(
  loaded: UserContactsResponse,
  draft: DealContactDraft,
): UserContactsRequest | null {
  const patch: UserContactsRequest = {};
  for (const field of TEXT_FIELDS) {
    const next = draft[field].trim();
    if (next === (loaded[field] ?? '')) continue;
    patch[field] = next.length === 0 ? null : next;
  }
  if (
    loaded.showToBuyer !== null &&
    draft.showToBuyer !== null &&
    draft.showToBuyer !== loaded.showToBuyer
  ) {
    patch.showToBuyer = draft.showToBuyer;
  }
  return Object.keys(patch).length === 0 ? null : patch;
}

function aborted(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export async function submitDealContacts(input: {
  loaded: UserContactsResponse;
  draft: DealContactDraft;
  stillOwns: () => boolean;
  update: (patch: UserContactsRequest) => Promise<UserContactsResponse>;
}): Promise<DealContactSaveResult> {
  const patch = dealContactPatch(input.loaded, input.draft);
  if (!patch) return { kind: 'unchanged' };
  const parsed = userContactsRequestSchema.safeParse(patch);
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? 'form');
    return {
      kind: 'invalid',
      field,
      message: FIELD_MESSAGE[field] ?? 'Проверьте контакты',
    };
  }
  if (!input.stillOwns()) return { kind: 'dropped' };
  try {
    const contacts = await input.update(parsed.data);
    if (!input.stillOwns()) return { kind: 'dropped' };
    return { kind: 'saved', contacts };
  } catch (error) {
    if (aborted(error) || !input.stillOwns()) return { kind: 'dropped' };
    if (error instanceof ApiClientError && error.status === 401) {
      return { kind: 'stale-session' };
    }
    return { kind: 'failed', message: 'Не удалось сохранить контакты' };
  }
}
