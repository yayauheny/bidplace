const accessTokenKey = 'bidplace.access-token';

export function readAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(accessTokenKey);
}

export function writeAccessToken(value: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(accessTokenKey, value);
}

export function clearAccessToken(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(accessTokenKey);
}
