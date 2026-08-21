export type SafeRedirect = `/${string}`;

const DEFAULT_REDIRECT: SafeRedirect = '/';
const INTERNAL_ORIGIN = 'https://bidplace.local';

const AUTH_PATHS = new Set(['/login', '/register', '/forgot-password', '/reset-password']);

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
