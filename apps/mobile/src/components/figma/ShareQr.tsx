import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { encodeShareQrSvg, SHARE_QR_SIZE, shareQrSlotStyle } from './share-qr';

export function ShareQr({ url }: { url: string }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSvg(null);

    void encodeShareQrSvg(url)
      .then((value) => {
        if (!cancelled) setSvg(value);
      })
      .catch(() => {
        if (!cancelled) setSvg(null);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="QR-код ссылки"
      style={shareQrSlotStyle()}
    >
      {svg ? (
        <SvgXml
          xml={svg}
          width={SHARE_QR_SIZE}
          height={SHARE_QR_SIZE}
          accessible={false}
        />
      ) : null}
    </View>
  );
}
