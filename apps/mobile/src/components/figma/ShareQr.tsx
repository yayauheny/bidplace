import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import QRCode from 'qrcode';
import { designTokens } from '@bidplace/design-tokens';

import { publicQrOptions } from './public-share';

export type ShareQrProps = {
  url: string;
  onReady: (png: string) => void;
  onError: (message: string) => void;
};

export function ShareQr({ url, onReady, onError }: ShareQrProps) {
  const [png, setPng] = useState<string>();
  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(url, publicQrOptions)
      .then((image) => {
        if (!active) return;
        setPng(image);
        onReady(image);
      })
      .catch(() => {
        if (active) onError('Не удалось создать QR-код.');
      });
    return () => {
      active = false;
    };
  }, [url, onReady, onError]);
  return png ? (
    <Image
      source={{ uri: png }}
      accessibilityLabel="QR-код публичной страницы"
      style={{
        width: designTokens.size.shareQr,
        height: designTokens.size.shareQr,
      }}
    />
  ) : null;
}
