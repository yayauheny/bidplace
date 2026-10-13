import { useState } from 'react';
import { Alert, Platform, Share, View } from 'react-native';
import { Copy, Flag, QrCode } from 'lucide-react-native';
import { designTokens } from '@bidplace/design-tokens';

import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import { AppDialog, AppText, MotionPressable } from '../../components/ui';
import { ShareSheet } from '../../components/figma/ShareSheet';
import { copyPublicLink, publicShareTarget } from '../../components/figma/public-share';

export function AuthorShare({
  sharePath,
  onUnavailable,
}: {
  sharePath: string;
  onUnavailable: (feature: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [message, setMessage] = useState('');

  const shareLink = async () => {
    try {
      const origin = Platform.OS === 'web' ? window.location.origin : 'https://bid.place';
      const url = publicShareTarget(sharePath, origin).url;
      if (Platform.OS === 'web') {
        await copyPublicLink(url);
        setMessage('Ссылка скопирована');
      } else {
        await Share.share({ message: url });
        setOpen(false);
      }
    } catch {
      if (Platform.OS === 'web') setMessage('Не удалось скопировать ссылку');
      else Alert.alert('Не удалось поделиться профилем');
    }
  };

  return (
    <>
      <View
        testID="author-share-group"
        style={{
          width: 42,
          height: 42,
          borderRadius: designTokens.radius.pill,
          backgroundColor: designTokens.color.headerControl,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FigmaIconButton
          icon="share-04"
          label="Поделиться профилем"
          onPress={() => {
            setMessage('');
            setOpen(true);
          }}
        />
      </View>
      <AppDialog presentation="sheet" open={open} onClose={() => setOpen(false)} title="Поделиться">
        <View style={{ gap: designTokens.space.x4 }}>
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel="Ссылка на профиль"
            onPress={() => void shareLink()}
            preset="button"
            style={{ minHeight: designTokens.size.touch, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <AppText role="bodySmall">Ссылка на профиль</AppText>
            <Copy size={20} color={designTokens.color.ink} />
          </MotionPressable>
          {message ? <AppText role="bodySmall" accessibilityLiveRegion="polite">{message}</AppText> : null}
          {Platform.OS === 'web' ? (
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel="QR-код профиля"
              onPress={() => {
                setOpen(false);
                setQrOpen(true);
              }}
              preset="button"
              style={{ minHeight: designTokens.size.touch, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <AppText role="bodySmall">QR-код</AppText>
              <QrCode size={20} color={designTokens.color.ink} />
            </MotionPressable>
          ) : null}
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel="Пожаловаться на автора"
            onPress={() => {
              setOpen(false);
              onUnavailable('Жалобы на профили');
            }}
            preset="button"
            style={{ minHeight: designTokens.size.touch, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <AppText role="bodySmall" tone="danger">Пожаловаться</AppText>
            <Flag size={20} color={designTokens.color.danger} />
          </MotionPressable>
        </View>
      </AppDialog>
      {Platform.OS === 'web' ? (
        <ShareSheet open={qrOpen} onClose={() => setQrOpen(false)} sharePath={sharePath} />
      ) : null}
    </>
  );
}
