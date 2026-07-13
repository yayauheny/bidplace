export function extractBearerToken(header: string | null | undefined): string {
  if (!header) {
    throw new Error('Missing authorization header');
  }

  const [scheme, token, ...rest] = header.trim().split(/\s+/);

  if (scheme !== 'Bearer' || !token || rest.length > 0) {
    throw new Error('Invalid authorization header');
  }

  return token;
}

export function readCookie(
  cookieHeader: string | null | undefined,
  cookieName: string,
): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const entry of cookieHeader.split(';')) {
    const [rawName, ...rawValueParts] = entry.trim().split('=');

    if (rawName !== cookieName || rawValueParts.length === 0) {
      continue;
    }

    return decodeURIComponent(rawValueParts.join('='));
  }

  return null;
}
