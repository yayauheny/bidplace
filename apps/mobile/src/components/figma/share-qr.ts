import QRCode from 'qrcode';

import { figmaTokens } from '@bidplace/design-tokens';

export const SHARE_QR_SIZE = 164;
export const SHARE_QR_RADIUS = 20;
export const SHARE_QR_PLACEHOLDER = '#d9d9d9';

export function canonicalizeShareUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error('share-url-empty');
  }
  return trimmed;
}

export function shareQrSlotStyle() {
  return {
    width: SHARE_QR_SIZE,
    height: SHARE_QR_SIZE,
    borderRadius: SHARE_QR_RADIUS,
    overflow: 'hidden' as const,
    backgroundColor: SHARE_QR_PLACEHOLDER,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}

export async function encodeShareQrSvg(url: string) {
  return QRCode.toString(canonicalizeShareUrl(url), {
    type: 'svg',
    margin: 1,
    width: SHARE_QR_SIZE,
    color: {
      dark: figmaTokens.color.ink,
      light: figmaTokens.color.white,
    },
  });
}

export async function encodeShareQrPngDataUrl(url: string) {
  return QRCode.toDataURL(canonicalizeShareUrl(url), {
    margin: 1,
    width: SHARE_QR_SIZE,
    color: {
      dark: figmaTokens.color.ink,
      light: figmaTokens.color.white,
    },
  });
}
