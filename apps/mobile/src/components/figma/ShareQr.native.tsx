import { useEffect, useRef, useState } from 'react';
import { Svg, Path, Rect } from 'react-native-svg';
import QRCode from 'qrcode';
import { designTokens } from '@bidplace/design-tokens';

import { publicQrOptions } from './public-share';
import type { ShareQrProps } from './ShareQr';

export function ShareQr({ url, onReady, onError }: ShareQrProps) {
  const svg = useRef<Svg>(null);
  const [symbol, setSymbol] = useState<{ path: string; size: number }>();
  const exported = useRef(false);
  useEffect(() => {
    try {
      const { modules } = QRCode.create(url, publicQrOptions);
      const margin = publicQrOptions.margin;
      const paths: string[] = [];
      for (let y = 0; y < modules.size; y++) {
        for (let x = 0; x < modules.size; x++) {
          if (modules.get(y, x))
            paths.push(`M${x + margin} ${y + margin}h1v1h-1z`);
        }
      }
      exported.current = false;
      setSymbol({ path: paths.join(''), size: modules.size + margin * 2 });
    } catch {
      onError('Не удалось создать QR-код.');
    }
  }, [url, onError]);
  if (!symbol) return null;
  return (
    <Svg
      ref={svg}
      width={designTokens.size.shareQr}
      height={designTokens.size.shareQr}
      viewBox={`0 0 ${symbol.size} ${symbol.size}`}
      accessibilityRole="image"
      accessibilityLabel="QR-код публичной страницы"
      onLayout={() => {
        if (exported.current || !svg.current) return;
        exported.current = true;
        try {
          svg.current.toDataURL(
            (base64) => {
              if (base64) onReady(`data:image/png;base64,${base64}`);
              else onError('Не удалось создать QR-код.');
            },
            { width: publicQrOptions.width, height: publicQrOptions.width },
          );
        } catch {
          onError('Не удалось создать QR-код.');
        }
      }}
    >
      <Rect
        width={symbol.size}
        height={symbol.size}
        fill={publicQrOptions.color.light}
      />
      <Path d={symbol.path} fill={publicQrOptions.color.dark} />
    </Svg>
  );
}
