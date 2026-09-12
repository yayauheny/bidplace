import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { Image } from 'expo-image';
import QRCode from 'qrcode';

import { designTokens } from '@bidplace/design-tokens';

import { AppDialog } from '../ui/AppDialog';
import { AppText, PrimaryButton, SecondaryButton } from '../ui';
import {
  copyPublicLink,
  downloadQrPng,
  publicShareTarget,
} from './public-share';

export function ShareSheet({
  open,
  onClose,
  sharePath,
}: {
  open: boolean;
  onClose: () => void;
  sharePath: string;
}) {
  return (
    <AppDialog
      presentation="sheet"
      open={open}
      title="Поделиться"
      onClose={onClose}
    >
      {open ? <ShareContent key={sharePath} sharePath={sharePath} /> : null}
    </AppDialog>
  );
}

function ShareContent({ sharePath }: { sharePath: string }) {
  const [qr, setQr] = useState<string>();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0);
  let target: ReturnType<typeof publicShareTarget> | undefined;
  try {
    if (Platform.OS === 'web')
      target = publicShareTarget(sharePath, window.location.origin);
  } catch {
    target = undefined;
  }
  const url = target?.url;
  useEffect(() => {
    if (!url) return;
    let active = true;
    setError('');
    void QRCode.toDataURL(url, {
      type: 'image/png',
      width: 656,
      margin: 4,
      errorCorrectionLevel: 'M',
    })
      .then((image) => {
        if (active) setQr(image);
      })
      .catch(() => {
        if (active) setError('Не удалось создать QR-код.');
      });
    return () => {
      active = false;
    };
  }, [url, attempt]);
  if (!target)
    return (
      <AppText role="bodySmall" tone="danger">
        Публичная ссылка недоступна.
      </AppText>
    );
  const { filename } = target;
  const copy = async () => {
    try {
      await copyPublicLink(target.url);
      setMessage('Ссылка скопирована.');
    } catch {
      setMessage('Не удалось скопировать ссылку. Её можно выделить ниже.');
    }
  };
  const download = () => {
    if (!qr) return;
    try {
      downloadQrPng(qr, filename);
      setMessage('QR подготовлен к скачиванию.');
    } catch {
      setMessage('Не удалось скачать QR. Попробуйте ещё раз.');
    }
  };
  return (
    <View style={{ gap: designTokens.space.x3 }}>
      <View style={{ alignItems: 'center' }}>
        {qr ? (
          <Image
            source={{ uri: qr }}
            accessibilityLabel="QR-код публичной страницы"
            style={{
              width: designTokens.size.shareQr,
              height: designTokens.size.shareQr,
            }}
          />
        ) : (
          <AppText role="bodySmall">{error || 'Создаём QR-код…'}</AppText>
        )}
      </View>
      {error ? (
        <SecondaryButton
          label="Повторить"
          onPress={() => setAttempt(attempt + 1)}
        />
      ) : null}
      <PrimaryButton
        label="Скачать QR"
        size="large"
        icon="qr-code-01"
        width="full"
        disabled={!qr}
        onPress={download}
      />
      <SecondaryButton
        label="Копировать ссылку"
        size="large"
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
