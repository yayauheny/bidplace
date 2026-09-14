import {
  portfolioAuthorSchema,
  portfolioWorkSchema,
} from '@bidplace/contracts';

export function publicShareTarget(sharePath: string, origin: string) {
  const valid =
    portfolioAuthorSchema.shape.sharePath.safeParse(sharePath).success ||
    portfolioWorkSchema.shape.sharePath.safeParse(sharePath).success;
  if (!valid) throw new Error('Invalid public share path');
  return {
    url: new URL(sharePath, origin).toString(),
    filename: `bidplace-${sharePath.split('/').at(-1)}.png`,
  };
}

export async function copyPublicLink(url: string) {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(url);
      return;
    } catch {
      // HTTP and denied clipboard permission still allow a user-initiated copy.
    }
  }
  const focused = document.activeElement;
  const field = document.createElement('textarea');
  field.value = url;
  field.readOnly = true;
  field.style.position = 'fixed';
  field.style.opacity = '0';
  const container = focused?.closest('[role="dialog"]') ?? document.body;
  container.appendChild(field);
  try {
    field.select();
    if (!document.execCommand('copy')) throw new Error('Copy unavailable');
  } finally {
    field.remove();
    if (focused instanceof HTMLElement) focused.focus({ preventScroll: true });
  }
}

export function downloadQrPng(dataUrl: string, filename: string) {
  const bytes = Uint8Array.from(atob(dataUrl.split(',')[1]), (char) =>
    char.charCodeAt(0),
  );
  const objectUrl = URL.createObjectURL(
    new Blob([bytes], { type: 'image/png' }),
  );
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
}
