import { useState } from 'react';
import { Alert, Platform, Share, View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import { FigmaIcon } from '../../components/figma/FigmaIcon';
import { FilterSheet } from '../../components/figma/FilterSheet';
import { copyPublicLink, publicShareTarget } from '../../components/figma/public-share';
import { AppText, MotionPressable } from '../../components/ui';

const reportColor = '#731A06'; // Figma 06: report action, not the destructive-error red.

export function AuthorShare({
  sharePath,
  onUnavailable,
}: {
  sharePath: string;
  onUnavailable: (feature: string) => void;
}) {
  const [open, setOpen] = useState(false);
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
      <FigmaIconButton
        icon="share-03"
        iconSize={20}
        strokeWidthPx={1.5}
        surface="muted"
        label="Поделиться профилем"
        onPress={() => {
          setMessage('');
          setOpen(true);
        }}
      />
      <FilterSheet
        presentation="compact"
        open={open}
        onClose={() => setOpen(false)}
        title=""
        accessibilityLabel="Поделиться"
      >
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="Ссылка на профиль"
          onPress={() => void shareLink()}
          preset="button"
          style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <AppText role="bodySmall">Ссылка на профиль</AppText>
          <FigmaIcon name="link-01" size={20} strokeWidthPx={1.5} />
        </MotionPressable>
        {message ? (
          <AppText role="caption" accessibilityLiveRegion="polite">
            {message}
          </AppText>
        ) : null}
        <View style={{ height: 1, backgroundColor: designTokens.color.divider }} />
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="Пожаловаться на автора"
          onPress={() => {
            setOpen(false);
            onUnavailable('Жалобы на профили');
          }}
          preset="button"
          style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <AppText role="bodySmall" style={{ color: reportColor }}>
            Пожаловаться
          </AppText>
          <FigmaIcon name="flag-01" size={20} strokeWidthPx={1.5} color={reportColor} />
        </MotionPressable>
      </FilterSheet>
    </>
  );
}
