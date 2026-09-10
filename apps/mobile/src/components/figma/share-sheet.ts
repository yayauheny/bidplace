import { canonicalizeShareUrl, encodeShareQrPngDataUrl, encodeShareQrSvg } from './share-qr';

export type ShareActionStatus = 'idle' | 'success' | 'error';

export function shareQrPngFilename() {
  return 'bidplace-share.png';
}

export function shareQrSvgFilename() {
  return 'bidplace-share.svg';
}

export async function copyShareUrl(url: string) {
  const canonical = canonicalizeShareUrl(url);
  const clipboard = globalThis.navigator?.clipboard;
  if (!clipboard?.writeText) {
    throw new Error('clipboard-unavailable');
  }
  await clipboard.writeText(canonical);
}

export function triggerBrowserDownload(href: string, filename: string) {
  if (typeof document === 'undefined') return false;
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  return true;
}

export async function downloadShareQr(url: string) {
  try {
    const href = await encodeShareQrPngDataUrl(url);
    if (!triggerBrowserDownload(href, shareQrPngFilename())) {
      throw new Error('download-unavailable');
    }
  } catch {
    const svg = await encodeShareQrSvg(url);
    const href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    if (!triggerBrowserDownload(href, shareQrSvgFilename())) {
      throw new Error('download-unavailable');
    }
  }
}

export function shareClipboardStatusMessage(status: ShareActionStatus) {
  if (status === 'success') return 'Ссылка скопирована.';
  if (status === 'error') return 'Не удалось скопировать ссылку.';
  return '';
}

export function shareDownloadStatusMessage(status: ShareActionStatus) {
  if (status === 'success') return 'QR сохранён.';
  if (status === 'error') return 'Не удалось сохранить QR.';
  return '';
}
