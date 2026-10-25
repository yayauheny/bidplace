import { useRef, useState } from 'react';
import { Platform, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppDialog } from '../ui/AppDialog';
import { AppText, SecondaryButton } from '../ui';
import { useAppTheme } from '../../providers/theme-provider';
import { ShareQr } from './ShareQr';
import { FigmaButton } from './FigmaButton';
import {
  copyPublicLink,
  downloadQrPng,
  publicShareTarget,
  publicShareOrigin,
} from './public-share';

const shareContentGap = designTokens.space.x3 + designTokens.space.x1 / 2; // Figma 597:19045 — 14px.

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
      presentation="compactSheet"
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
  const [downloading, setDownloading] = useState(false);
  const downloadBusy = useRef(false);
  const palette = useAppTheme();
  let target: ReturnType<typeof publicShareTarget> | undefined;
  try {
    target = publicShareTarget(sharePath, publicShareOrigin());
  } catch {
    target = undefined;
  }
  const url = target?.url;
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
  const download = async () => {
    if (!qr || downloadBusy.current) return;
    downloadBusy.current = true;
    setDownloading(true);
    try {
      await downloadQrPng(qr, filename);
      setMessage(
        Platform.OS === 'web'
          ? 'Скачивание QR началось.'
          : 'Меню сохранения QR закрыто.',
      );
    } catch {
      setMessage('Не удалось скачать QR. Попробуйте ещё раз.');
    } finally {
      downloadBusy.current = false;
      setDownloading(false);
    }
  };
  return (
    <View style={{ gap: shareContentGap }}>
      <View
        style={{
          width: designTokens.size.shareQr + designTokens.space.x3 * 2,
          height: designTokens.size.shareQr + designTokens.space.x3 * 2,
          padding: designTokens.space.x3,
          alignSelf: 'center',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderRadius: designTokens.radius.shareSheet,
          backgroundColor: palette.white,
        }}
      >
        <ShareQr
          key={attempt}
          url={target.url}
          onReady={setQr}
          onError={setError}
        />
        {!qr ? (
          <AppText
            role="bodySmall"
            tone={error ? 'danger' : 'secondary'}
            style={{
              position: 'absolute',
              paddingHorizontal: designTokens.space.x4,
              textAlign: 'center',
            }}
          >
            {error || 'Создаём QR-код…'}
          </AppText>
        ) : null}
      </View>
      {error ? (
        <SecondaryButton
          label="Повторить"
          onPress={() => {
            setError('');
            setAttempt(attempt + 1);
          }}
        />
      ) : null}
      <View style={{ gap: designTokens.space.x2 }}>
        <FigmaButton
          variant="solid"
          size="sheetAction"
          label="Скачать QR"
          icon="qr-code-01"
          width="full"
          disabled={!qr}
          loading={downloading}
          onPress={() => void download()}
        />
        <FigmaButton
          label="Копировать ссылку"
          variant="ghost"
          size="sheetAction"
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
