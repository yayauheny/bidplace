export type SafeRedirect = `/${string}`;
type SearchParams = Record<string, string | string[] | undefined>;

const DEFAULT_REDIRECT: SafeRedirect = '/';
const INTERNAL_ORIGIN = 'https://bidplace.local';

const AUTH_PATHS = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]);

export function getSafeRedirect(
  rawParam: string | string[] | null | undefined,
): SafeRedirect {
  const raw = Array.isArray(rawParam) ? rawParam[0] : rawParam;

  if (!raw) {
    return DEFAULT_REDIRECT;
  }

  try {
    const url = new URL(raw, INTERNAL_ORIGIN);

    // Разрешены только внутренние переходы.
    if (url.origin !== INTERNAL_ORIGIN) {
      return DEFAULT_REDIRECT;
    }

    const normalizedPath = url.pathname.replace(/\/+$/, '') || '/';

    // Не возвращаем пользователя обратно на auth-экраны.
    if (AUTH_PATHS.has(normalizedPath)) {
      return DEFAULT_REDIRECT;
    }

    return `${url.pathname}${url.search}${url.hash}` as SafeRedirect;
  } catch {
    return DEFAULT_REDIRECT;
  }
}

export function getProtectedRedirect(
  pathname: string,
  params: SearchParams,
  dynamicParamNames: readonly string[],
): SafeRedirect {
  const dynamicParams = new Set(dynamicParamNames);
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (dynamicParams.has(key) || value === undefined) {
      continue;
    }

    for (const item of Array.isArray(value) ? value : [value]) {
      search.append(key, item);
    }
  }

  const serializedSearch = search.toString();
  const suffix = serializedSearch ? `?${serializedSearch}` : '';
  return getSafeRedirect(`${pathname}${suffix}`);
}
