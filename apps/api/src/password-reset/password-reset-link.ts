export function buildPasswordResetLink(baseUrl: string, token: string): string {
  const url = new URL('/reset-password', baseUrl);
  url.searchParams.set('token', token);
  return url.toString();
}
