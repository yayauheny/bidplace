import { useEffect, useState } from 'react';
import { Platform, Share, View } from 'react-native';
import { Image } from 'expo-image';
import * as ExpoLinking from 'expo-linking';
import QRCode from 'qrcode';

import { designTokens } from '@bidplace/design-tokens';

import { AppDialog } from '../../components/ui/AppDialog';
import {
  AppText,
  MotionPressable,
  PrimaryButton,
  SecondaryButton,
} from '../../components/ui';
import { FigmaGlassSurface } from '../../components/figma/FigmaGlassSurface';
import { FigmaIcon } from '../../components/figma/FigmaIcon';
import { canonicalShareUrl } from '../../lib/canonical-share-url';

export function AuthorShare({
  sharePath,
  slug,
}: {
  sharePath: string;
  slug: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <FigmaGlassSurface
        preset="controlGroup"
        testID="author-share-group"
        contentStyle={{
          paddingLeft: designTokens.space.identityGap,
          paddingRight: designTokens.space.identityGap,
          paddingTop: designTokens.space.socialGroupY,
          paddingBottom: designTokens.space.socialGroupY,
        }}
      >
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="Поделиться профилем"
          onPress={() => setOpen(true)}
          preset="icon"
          style={{
            width: designTokens.size.control,
            height: designTokens.size.control,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: designTokens.radius.pill,
          }}
        >
          <FigmaIcon name="share-04" size={designTokens.size.socialGroupIcon} />
        </MotionPressable>
      </FigmaGlassSurface>
      <AppDialog
        presentation="sheet"
        open={open}
        title="Поделиться"
        onClose={() => setOpen(false)}
      >
        {open ? <AuthorShareContent sharePath={sharePath} slug={slug} /> : null}
      </AppDialog>
    </>
  );
}

function AuthorShareContent({
  sharePath,
  slug,
}: {
  sharePath: string;
  slug: string;
}) {
  const url = canonicalShareUrl(sharePath, undefined, ExpoLinking.createURL);
  const [qr, setQr] = useState<string>();
  const [qrError, setQrError] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    void QRCode.toString(url, {
      type: 'svg',
      margin: 4,
      errorCorrectionLevel: 'M',
    })
      .then((svg) => {
        if (active)
          setQr(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
      })
      .catch(() => {
        if (active) setQrError(true);
      });
    return () => {
      active = false;
    };
  }, [url]);

  const copy = async () => {
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(url);
        setMessage('Ссылка скопирована.');
      } else {
        await Share.share({ message: url });
      }
    } catch {
      setMessage('Не удалось скопировать ссылку. Её можно выделить ниже.');
    }
  };
  const download = () => {
    if (!qr || Platform.OS !== 'web') return;
    const link = document.createElement('a');
    link.href = qr;
    link.download = `bidplace-${slug}.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
  return (
    <View style={{ gap: designTokens.space.x3 }}>
      <View style={{ alignItems: 'center' }}>
        {qr ? (
          <Image
            source={{ uri: qr }}
            accessibilityLabel={`QR-код профиля @${slug}`}
            style={{
              width: designTokens.size.shareQr,
              height: designTokens.size.shareQr,
            }}
          />
        ) : (
          <AppText role="bodySmall">
            {qrError ? 'Не удалось создать QR-код.' : 'Создаём QR-код…'}
          </AppText>
        )}
      </View>
      {Platform.OS === 'web' ? (
        <PrimaryButton
          label="Скачать QR"
          icon="qr-code-01"
          width="full"
          disabled={!qr}
          onPress={download}
        />
      ) : null}
      <SecondaryButton
        label={
          Platform.OS === 'web' ? 'Копировать ссылку' : 'Поделиться ссылкой'
        }
        icon="copy"
        width="full"
        onPress={() => void copy()}
      />
      <AppText role="caption" selectable style={{ textAlign: 'center' }}>
        {url}
      </AppText>
      {message ? (
        <AppText role="caption" accessibilityLiveRegion="polite">
          {message}
        </AppText>
      ) : null}
    </View>
  );
}
