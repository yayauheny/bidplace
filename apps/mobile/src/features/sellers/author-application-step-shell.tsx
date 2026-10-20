import { type ReactNode } from 'react';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { BackButton } from '../../components/figma/BackButton';
import { FigmaIcon } from '../../components/figma/FigmaIcon';
import { MotionPressable } from '../../components/ui/MotionPressable';
import { AppText } from '../../components/ui';
import { useAppTheme } from '../../providers/theme-provider';
import { SellerProfileCreationStepSelector } from './seller-profile-steps';

const chrome = designTokens.authorApplication;

export function AuthorApplicationStepShell({
  profileStep,
  closeDisabled,
  onClose,
  onBack,
  backDisabled = false,
  headerToBodyGap = chrome.headerToBodyStep,
  title,
  subtitle,
  children,
  footer,
}: {
  profileStep: number;
  closeDisabled: boolean;
  onClose: () => void;
  onBack?: () => void;
  backDisabled?: boolean;
  headerToBodyGap?: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const palette = useAppTheme();
  const showBack = profileStep > 1;

  return (
    <View style={{ gap: headerToBodyGap }}>
      <View style={{ gap: chrome.headerBlockGap }}>
        <View
          style={{
            height: chrome.chromeFrame,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {showBack ? (
            <BackButton
              variant="chrome"
              disabled={backDisabled || onBack === undefined}
              onPress={() => onBack?.()}
            />
          ) : (
            <View style={{ width: chrome.chromeFrame }} />
          )}
          <SellerProfileCreationStepSelector profileStep={profileStep} />
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel="Закрыть"
            disabled={closeDisabled}
            hitSlop={(designTokens.size.touch - chrome.chromeFrame) / 2}
            onPress={onClose}
            preset="icon"
            style={{
              width: chrome.chromeFrame,
              height: chrome.chromeFrame,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FigmaIcon
              name="x"
              size={chrome.chromeGlyph}
              strokeWidthPx={chrome.chromeStroke}
              color={palette.inkStrong}
            />
          </MotionPressable>
        </View>
        <View style={{ gap: chrome.titleStackGap }}>
          <AppText
            role="mediaSheetTitle"
            tone="strong"
            accessibilityRole="header"
            style={{ textAlign: 'center' }}
          >
            {title}
          </AppText>
          {subtitle ? (
            <AppText
              role="authCaption"
              tone="subdued"
              style={{ textAlign: 'center' }}
            >
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>
      <View style={{ gap: chrome.bodyFieldGap }}>
        {children}
        {footer ? <View style={{ alignSelf: 'center' }}>{footer}</View> : null}
      </View>
    </View>
  );
}
