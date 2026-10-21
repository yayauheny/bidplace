import Animated, {
  useAnimatedStyle,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { sheetTimingConfig } from '../../lib/layout-transition';
import { useState } from 'react';
import { Link } from 'expo-router';
import { Platform, View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

import { useDesktopNavigation } from '../../components/layout/public-navigation';
import { FigmaButton } from '../../components/figma/FigmaButton';
import { BackButton } from '../../components/figma/BackButton';
import { FigmaIcon } from '../../components/figma/FigmaIcon';
import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { FilterSheet } from '../../components/figma/FilterSheet';
import { ShareSheet } from '../../components/figma/ShareSheet';
import { figmaIconButtonStyle } from '../../components/figma/figma-icon-button-style';
import { AppText, MotionPressable } from '../../components/ui';
import { useAppTheme } from '../../providers/theme-provider';
import { AuthorShare } from './AuthorShare';
import { CreatorIdentity } from './CreatorIdentity';
import type { CreatorHeaderProps } from './creator-header';

// Figma4306:8453 /4594:36802, excluding the system status bar.
const actionTop = 18;

export function CreatorHeader({
  toolbar,
  scrollY,
  profile,
  onBack,
  tabs,
  tab,
  onTabChange,
  panelId,
  isOwner = false,
  onUnavailable,
}: CreatorHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const palette = useAppTheme();
  const desktop = useDesktopNavigation();
  const threshold = useSharedValue(0);
  const rowHeight = useSharedValue(42);
  const docked = useSharedValue(false);
  const hiddenValue = useSharedValue(false);
  const [actionsHidden, setActionsHidden] = useState(false);
  const pinnedProgress = useDerivedValue(() =>
    withTiming(docked.value ? 1 : 0, sheetTimingConfig),
  );
  useAnimatedReaction(
    () => ({ y: scrollY.value, end: threshold.value, height: rowHeight.value }),
    ({ y, end, height }) => {
      if (desktop || end <= 0 || y <= end - designTokens.space.sectionGap)
        docked.value = false;
      else if (y >= end) docked.value = true;
      const hidden = !desktop && y > actionTop + height && !docked.value;
      if (hidden !== hiddenValue.value) {
        hiddenValue.value = hidden;
        scheduleOnRN(setActionsHidden, hidden);
      }
    },
  );
  const actionMotion = useAnimatedStyle(() => {
    const outsideInitialRow =
      !desktop && scrollY.value > actionTop + rowHeight.value;
    return {
      transform: [
        {
          translateY: outsideInitialRow
            ? scrollY.value -
              actionTop -
              rowHeight.value * (1 - pinnedProgress.value)
            : 0,
        },
      ],
      opacity: outsideInitialRow ? pinnedProgress.value : 1,
    };
  });
  const surfaceMotion = useAnimatedStyle(() => ({
    opacity: pinnedProgress.value,
  }));

  return (
    <View
      testID="creator-static-header"
      style={{ zIndex: designTokens.layer.chrome }}
      onLayout={(event) => {
        threshold.value = event.nativeEvent.layout.height;
      }}
    >
      <View
        testID="author-header"
        style={{
          paddingTop: desktop ? 40 : actionTop,
          flexDirection: desktop ? 'row-reverse' : 'column',
          alignItems: desktop ? 'flex-start' : 'stretch',
          gap: desktop ? designTokens.space.x5 : 0,
        }}
      >
        <Animated.View
          testID="creator-action-bar"
          onLayout={(event) => {
            rowHeight.value = event.nativeEvent.layout.height;
          }}
          accessibilityElementsHidden={actionsHidden}
          importantForAccessibility={
            actionsHidden ? 'no-hide-descendants' : 'auto'
          }
          {...(Platform.OS === 'web' && actionsHidden ? { inert: true } : {})}
          style={[
            actionMotion,
            {
              zIndex: designTokens.layer.chrome,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',

              marginBottom: desktop ? 0 : designTokens.space.x5,
              flexShrink: 0,
            },
          ]}
        >
          <Animated.View
            pointerEvents="none"
            aria-hidden
            style={[
              {
                position: 'absolute',
                top: -actionTop,
                bottom: -12,
                left: -12,
                right: -12,
                backgroundColor: palette.canvas,
              },
              surfaceMotion,
            ]}
          />
          <View
            testID="author-back"
            style={{ display: desktop ? 'none' : 'flex' }}
          >
            <BackButton onPress={onBack} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {!desktop ? (
              <FigmaIconButton
                icon="heart"
                iconSize={20}
                strokeWidthPx={1.5}
                surface="muted"
                label="Добавить автора в избранное"
                onPress={() => onUnavailable('Избранные авторы')}
              />
            ) : null}
            <AuthorShare
              trigger={desktop ? 'label' : 'icon'}
              owner={isOwner}
              sharePath={profile.sharePath}
              onUnavailable={onUnavailable}
            />
            {isOwner && desktop ? (
              <FigmaButton
                label="Настройки"
                variant="muted"
                icon="setting-07"
                iconPosition="right"
                href="/account/settings"
              />
            ) : isOwner ? (
              <Link href="/profile" asChild>
                <MotionPressable
                  accessibilityRole="link"
                  accessibilityLabel="Редактировать профиль автора"
                  preset="icon"
                  style={({ pressed }) =>
                    figmaIconButtonStyle(pressed, 'muted', palette)
                  }
                >
                  <FigmaIcon name="pencil-edit-01" size={20} />
                </MotionPressable>
              </Link>
            ) : null}
            <FigmaIconButton
              icon="more-vertical"
              iconSize={20}
              strokeWidthPx={1.5}
              surface="muted"
              label="Действия с профилем"
              onPress={() => setMenuOpen(true)}
            />
          </View>
        </Animated.View>
        <View style={{ flex: desktop ? 1 : undefined, minWidth: 0 }}>
          <CreatorIdentity
            profile={profile}
            onSubscribe={() => onUnavailable('Подписка на авторов')}
          />
        </View>
      </View>
      <View
        style={{
          flexDirection: desktop ? 'row' : 'column',
          alignItems: desktop ? 'center' : 'stretch',
          gap: designTokens.space.x5,
          minHeight: desktop ? 54 : undefined,
        }}
      >
        <View style={{ flex: desktop ? 1 : undefined, minWidth: 0 }}>
          <FigmaTabs
            tabs={tabs}
            value={tab}
            onChange={onTabChange}
            label="Профиль автора"
            panelId={panelId}
            align={desktop ? 'start' : 'center'}
            fill={Platform.OS === 'web'}
          />
        </View>
        <View
          style={{
            flexShrink: 1,
            alignItems: desktop ? 'flex-end' : 'stretch',
          }}
        >
          {toolbar}
        </View>
      </View>
      <FilterSheet
        presentation="compact"
        title="Действия"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      >
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="QR-код профиля"
          onPress={() => {
            setMenuOpen(false);
            setQrOpen(true);
          }}
          preset="button"
          style={{
            minHeight: 44,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <AppText role="bodySmall">QR-код профиля</AppText>
          <FigmaIcon name="qr-code-01" size={20} />
        </MotionPressable>
      </FilterSheet>
      <ShareSheet
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        sharePath={profile.sharePath}
      />
    </View>
  );
}
