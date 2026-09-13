import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { Image } from 'expo-image';
import QRCode from 'qrcode';

import { designTokens } from '@bidplace/design-tokens';

import { AppDialog } from '../ui/AppDialog';
import { AppText, PrimaryButton, SecondaryButton } from '../ui';
import { FigmaButton } from './FigmaButton';
import {
  copyPublicLink,
  downloadQrPng,
  publicShareTarget,
} from './public-share';

const shareContentGap =
  designTokens.space.x3 + designTokens.space.x1 / 2; // Figma 597:19045 — 14px.

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
      setMessage('Не удалось скопировать ссылку. Ссылка доступна ниже.');
    }
  };
  const download = () => {
    if (!qr) return;
    try {
      downloadQrPng(qr, filename);
      setMessage('Скачивание QR началось.');
    } catch {
      setMessage('Не удалось скачать QR. Попробуйте ещё раз.');
    }
  };
  return (
    <View style={{ gap: shareContentGap }}>
      <View
        style={{
          width: designTokens.size.shareQr,
          height: designTokens.size.shareQr,
          alignSelf: 'center',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderRadius: designTokens.radius.shareSheet,
          backgroundColor: designTokens.color.surfaceMuted,
        }}
      >
        {qr ? (
          <Image
            source={{ uri: qr }}
            accessibilityLabel="QR-код публичной страницы"
            style={{
              width: designTokens.size.shareQr,
              height: designTokens.size.shareQr,
              borderRadius: designTokens.radius.shareSheet,
            }}
          />
        ) : (
          <AppText
            role="bodySmall"
            tone={error ? 'danger' : 'secondary'}
            style={{
              paddingHorizontal: designTokens.space.x4,
              textAlign: 'center',
            }}
          >
            {error || 'Создаём QR-код…'}
          </AppText>
        )}
      </View>
      {error ? (
        <SecondaryButton
          label="Повторить"
          onPress={() => setAttempt(attempt + 1)}
        />
      ) : null}
      <View style={{ gap: designTokens.space.x2 }}>
        <PrimaryButton
          label="Скачать QR"
          size="large"
          icon="qr-code-01"
          width="full"
          disabled={!qr}
          onPress={download}
        />
        <FigmaButton
          label="Копировать ссылку"
          variant="ghost"
          size="large"
          icon="copy"
          width="full"
          onPress={() => void copy()}
        />
      </View>
      {message ? (
        <View style={{ gap: designTokens.space.x1 }}>
          <AppText
            role="caption"
            accessibilityLiveRegion="polite"
            style={{ textAlign: 'center' }}
          >
            {message}
          </AppText>
          {message.startsWith('Не удалось скопировать') ? (
            <AppText
              role="caption"
              selectable
              numberOfLines={1}
              ellipsizeMode="middle"
              style={{ maxWidth: '100%', textAlign: 'center' }}
            >
              {url}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
