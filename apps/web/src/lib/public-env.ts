export function getPublicApiUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_URL;

  if (!value) {
    return 'http://localhost:3001';
  }

  return value;
}
