const instagramHandle = /^[A-Za-z0-9._]{1,30}$/;
const telegramHandle = /^[A-Za-z0-9_]{5,32}$/;

function canonicalHandle(value: string, kind: 'instagram' | 'telegram') {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withoutAt = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
  const match = kind === 'instagram'
    ? withoutAt.match(/^https:\/\/(?:www\.)?instagram\.com\/([^/?#]+)\/?$/i)
    : withoutAt.match(/^https:\/\/t\.me\/([^/?#]+)\/?$/i);
  const handle = match?.[1] ?? withoutAt;
  const valid = kind === 'instagram' ? instagramHandle : telegramHandle;
  if (!valid.test(handle)) return undefined;
  return kind === 'instagram'
    ? `https://instagram.com/${handle}`
    : `https://t.me/${handle}`;
}

export function normalizeInstagram(value: string) {
  return canonicalHandle(value, 'instagram');
}

export function normalizeTelegram(value: string) {
  return canonicalHandle(value, 'telegram');
}
