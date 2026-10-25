import { useRef, useState, type ElementRef } from 'react';
import { Alert, Platform, Share, View } from 'react-native';

import { FigmaButton } from '../../components/figma/FigmaButton';
import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import { FigmaIcon } from '../../components/figma/FigmaIcon';
import { FilterSheet } from '../../components/figma/FilterSheet';
import {
  copyPublicLink,
  publicShareTarget,
  publicShareOrigin,
} from '../../components/figma/public-share';
import { AppText, MotionPressable } from '../../components/ui';
import { useAppTheme } from '../../providers/theme-provider';

// Report action color (Figma 06) lives in the semantic palette as `report`;
// it is not the destructive-error red.

export function AuthorShare({
  sharePath,
  onUnavailable,
  owner = false,
  trigger = 'icon',
}: {
  sharePath: string;
  onUnavailable: (feature: string) => void;
  /** Owner account share: the public "Пожаловаться" action does not apply. */
  owner?: boolean;
  trigger?: 'icon' | 'label';
}) {
  const palette = useAppTheme();
  const triggerRef = useRef<ElementRef<typeof MotionPressable>>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  const shareLink = async () => {
    try {
      const origin = publicShareOrigin();
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
      {trigger === 'label' ? (
        <FigmaButton
          ref={triggerRef}
          label="Поделиться"
          variant={open ? 'solid' : 'muted'}
          icon="share-03"
          iconPosition="right"
          onPress={() => {
            setMessage('');
            setOpen(true);
          }}
        />
      ) : (
        <FigmaIconButton
          ref={triggerRef}
          icon="share-03"
          iconSize={20}
          surface={open ? 'active' : 'muted'}
          expanded={open}
          label="Поделиться профилем"
          onPress={() => {
            setMessage('');
            setOpen(true);
          }}
        />
      )}
      <FilterSheet
        returnFocusRef={triggerRef}
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
          style={{
            minHeight: 44,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <AppText role="bodySmall">Ссылка на профиль</AppText>
          <FigmaIcon name="link-01" size={20} />
        </MotionPressable>
        {message ? (
          <AppText role="caption" accessibilityLiveRegion="polite">
            {message}
          </AppText>
        ) : null}
        {owner ? null : (
          <>
            <View style={{ height: 1, backgroundColor: palette.divider }} />
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel="Пожаловаться на автора"
              onPress={() => {
                setOpen(false);
                onUnavailable('Жалобы на профили');
              }}
              preset="button"
              style={{
                minHeight: 44,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <AppText role="bodySmall" style={{ color: palette.report }}>
                Пожаловаться
              </AppText>
              <FigmaIcon name="flag-01" size={20} color={palette.report} />
            </MotionPressable>
          </>
        )}
      </FilterSheet>
    </>
  );
}
