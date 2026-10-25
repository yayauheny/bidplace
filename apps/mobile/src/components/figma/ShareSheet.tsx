import { useState } from 'react';
import { Platform, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppDialog } from '../ui/AppDialog';
import { AppText, SecondaryButton } from '../ui';
import { useAppTheme } from '../../providers/theme-provider';
import { useShareAction } from './use-share-action';
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
      {/* Keep geometry through exit motion; active resets feedback on close. */}
      <ShareContent key={sharePath} sharePath={sharePath} active={open} />
    </AppDialog>
  );
}

function ShareContent({
  sharePath,
  active,
}: {
  sharePath: string;
  active: boolean;
}) {
  const [qr, setQr] = useState<string>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const copyAction = useShareAction(active);
  const downloadAction = useShareAction(active);
  const palette = useAppTheme();
  let target: ReturnType<typeof publicShareTarget> | undefined;
  try {
    target = publicShareTarget(sharePath, publicShareOrigin());
  } catch {
    target = undefined;
  }
  if (!target)
    return (
      <AppText role="bodySmall" tone="danger">
        Публичная ссылка недоступна.
      </AppText>
    );
  const { filename } = target;
  const copy = () => void copyAction.run(() => copyPublicLink(target.url));
  const download = () => {
    if (qr) void downloadAction.run(() => downloadQrPng(qr, filename));
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
          onPress={download}
          feedback={{
            active: downloadAction.status !== 'idle',
            label:
              downloadAction.status === 'error'
                ? 'Не скачано. Повторить'
                : Platform.OS === 'web'
                  ? 'Загрузка начата'
                  : 'PNG подготовлен',
            icon: downloadAction.status === 'error' ? 'qr-code-01' : 'check',
          }}
          accessibilityHint={downloadAction.status === 'error' ? 'Не удалось скачать QR. Нажмите, чтобы повторить.' : Platform.OS === 'web' ? 'Открыть загрузку PNG в браузере.' : 'Выберите место сохранения PNG в системном меню.'}
        />
        <FigmaButton
          label="Копировать ссылку"
          variant="ghost"
          size="sheetAction"
          icon="copy"
          width="full"
          onPress={copy}
          feedback={{
            active: copyAction.status !== 'idle',
            label:
              copyAction.status === 'error'
                ? 'Не скопировано. Повторить'
                : 'Скопировано',
            icon: copyAction.status === 'error' ? 'copy' : 'check',
          }}
          accessibilityHint={
            copyAction.status === 'error'
              ? 'Не удалось скопировать ссылку. Нажмите, чтобы повторить.'
              : undefined
          }
        />
      </View>
    </View>
  );
}
