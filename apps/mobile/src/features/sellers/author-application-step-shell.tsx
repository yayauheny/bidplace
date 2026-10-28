import { type ReactNode } from 'react';
import { Platform, View } from 'react-native';

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
  headerBlockGap = chrome.headerBlockGap,
  titleRole = 'mediaSheetTitle',
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
  headerBlockGap?: number;
  titleRole?: 'workTitle' | 'mediaSheetTitle';
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const palette = useAppTheme();
  const showBack = profileStep > 0;

  return (
    <View style={{ gap: headerToBodyGap }}>
      <View style={{ gap: headerBlockGap }}>
        <View
          style={{
            // Native hit testing requires the parent to include the full control.
            height:
              Platform.OS === 'web'
                ? chrome.chromeFrame
                : designTokens.size.touch,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View
            style={{
              width: designTokens.size.touch,
              height: designTokens.size.touch,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {showBack ? (
              <BackButton
                surface="plain"
                disabled={backDisabled || onBack === undefined}
                onPress={() => onBack?.()}
              />
            ) : null}
          </View>
          <SellerProfileCreationStepSelector
            profileStep={profileStep + 1}
            total={5}
          />
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel="Закрыть"
            disabled={closeDisabled}
            onPress={onClose}
            preset="icon"
            style={{
              width: designTokens.size.touch,
              height: designTokens.size.touch,
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
            role={titleRole}
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
