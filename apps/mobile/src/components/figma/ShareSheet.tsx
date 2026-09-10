import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Platform, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { useDismissibleOverlay } from '../layout/use-dismissible-overlay';
import { AppText } from '../ui/AppText';
import { FigmaButton } from './FigmaButton';
import { FigmaIconButton } from './FigmaIconButton';
import { OverlayDimmer } from './OverlayDimmer';
import { ShareQr } from './ShareQr';
import {
  copyShareUrl,
  downloadShareQr,
  shareClipboardStatusMessage,
  shareDownloadStatusMessage,
  type ShareActionStatus,
} from './share-sheet';
import {
  isTabKey,
  nextFocusIndex,
  SHARE_SHEET_FOCUSABLE,
} from './share-sheet-focus';
import {
  shareSheetHeaderStyle,
  shareSheetLayerStyle,
  shareSheetPanelStyle,
} from './share-sheet-style';

export function ShareSheet({
  open,
  url,
  onClose,
}: {
  open: boolean;
  url: string;
  onClose: () => void;
}) {
  const sheetRef = useRef<View>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [copyStatus, setCopyStatus] = useState<ShareActionStatus>('idle');
  const [downloadStatus, setDownloadStatus] =
    useState<ShareActionStatus>('idle');

  const restoreFocus = useCallback(() => {
    if (Platform.OS !== 'web') return;
    const element = returnFocusRef.current;
    if (element?.isConnected) {
      const focusTrigger = (attempt: number) => {
        if (!element.isConnected) return;
        element.focus({ preventScroll: true });
        if (document.activeElement === element || attempt >= 3) {
          returnFocusRef.current = null;
          return;
        }
        window.setTimeout(() => focusTrigger(attempt + 1), 16);
      };
      window.setTimeout(() => focusTrigger(0), 0);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setCopyStatus('idle');
      setDownloadStatus('idle');
    }
  }, [open]);

  useEffect(() => {
    if (
      !open ||
      Platform.OS !== 'web' ||
      typeof document === 'undefined' ||
      returnFocusRef.current
    ) {
      return;
    }
    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLElement &&
      !activeElement.closest('[role="dialog"]')
    ) {
      returnFocusRef.current = activeElement;
    }
  }, [open]);

  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    const focusClose = (attempt: number) => {
      const control = document.querySelector<HTMLElement>(
        '#share-sheet button:not([disabled]), #share-sheet a[href]',
      );
      control?.focus({ preventScroll: true });
      if (control || attempt >= 10) return;
      window.setTimeout(() => focusClose(attempt + 1), 50);
    };
    const timer = window.setTimeout(() => focusClose(0), 0);
    return () => {
      window.clearTimeout(timer);
      restoreFocus();
    };
  }, [open, restoreFocus]);

  useEffect(() => {
    if (!open || Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const trapTab = (event: KeyboardEvent) => {
      if (!isTabKey(event)) return;
      const root = document.getElementById('share-sheet');
      if (!root) return;
      const focusable = [
        ...root.querySelectorAll<HTMLElement>(SHARE_SHEET_FOCUSABLE),
      ];
      if (focusable.length === 0) return;
      const current = focusable.findIndex((node) => node === document.activeElement);
      const next = nextFocusIndex(
        current < 0 ? 0 : current,
        focusable.length,
        event.shiftKey,
      );
      event.preventDefault();
      focusable[next]?.focus({ preventScroll: true });
    };

    document.addEventListener('keydown', trapTab);
    return () => document.removeEventListener('keydown', trapTab);
  }, [open]);

  useDismissibleOverlay({
    open,
    onClose: () => onClose(),
    getSurfaces: () => [
      sheetRef.current as unknown as { contains: (node: Node | null) => boolean },
    ],
    restoreFocus,
  });

  if (!open) return null;

  const statusMessage = [
    shareClipboardStatusMessage(copyStatus),
    shareDownloadStatusMessage(downloadStatus),
  ]
    .filter(Boolean)
    .join(' ');

  const sheet = (
    <View
      style={[
        shareSheetLayerStyle(),
        Platform.OS === 'web' ? ({ position: 'fixed' } as const) : null,
      ]}
    >
      <OverlayDimmer onPress={onClose} />
      <View
        ref={sheetRef}
        nativeID="share-sheet"
        role="dialog"
        accessibilityLabel="Поделиться"
        accessibilityViewIsModal
        style={shareSheetPanelStyle()}
      >
        <View style={shareSheetHeaderStyle()}>
          <AppText role="label" style={{ flex: 1 }}>
            Поделиться
          </AppText>
          <FigmaIconButton icon="x" label="Закрыть" onPress={onClose} />
        </View>
        <ShareQr url={url} />
        <View style={{ width: '100%', gap: figmaTokens.space.x2 }}>
          <FigmaButton
            label="Скачать QR"
            icon="qr-code-01"
            variant="solid"
            width="full"
            onPress={() => {
              void downloadShareQr(url)
                .then(() => setDownloadStatus('success'))
                .catch(() => setDownloadStatus('error'));
            }}
          />
          <FigmaButton
            label="Копировать ссылку"
            icon="copy"
            variant="ghost"
            width="full"
            onPress={() => {
              void copyShareUrl(url)
                .then(() => setCopyStatus('success'))
                .catch(() => setCopyStatus('error'));
            }}
          />
        </View>
        {statusMessage ? (
          <AppText
            role="caption"
            accessibilityLiveRegion="polite"
            tone={
              copyStatus === 'error' || downloadStatus === 'error'
                ? 'danger'
                : 'success'
            }
          >
            {statusMessage}
          </AppText>
        ) : null}
      </View>
    </View>
  );

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return createPortal(sheet, document.body);
  }

  return sheet;
}
