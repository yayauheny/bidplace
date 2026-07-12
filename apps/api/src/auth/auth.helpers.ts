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
