import { useId, type ReactNode } from 'react';
import { Modal, Platform, ScrollView, useWindowDimensions, View } from 'react-native';

import {
  designTokens,
  figmaTokens,
  type FigmaButtonSize,
} from '@bidplace/design-tokens';

import { AppText } from '../ui/AppText';
import { MotionPressable } from '../ui/MotionPressable';
import { FigmaButton } from './FigmaButton';
import { FigmaIcon } from './FigmaIcon';
import { FilterSheetActionRow } from './FilterSheetActionRow';
import { OverlayDimmer } from './OverlayDimmer';
import {
  filterSheetHeaderStyle,
  filterSheetPanelStyle,
  filterSheetTitleStyle,
} from './filter-sheet-style';
import { useDismissibleOverlay } from '../layout/use-dismissible-overlay';
import { useOverlayFocusTrap } from '../layout/use-overlay-focus-trap';

export function FilterSheet({
  open,
  onClose,
  title,
  titleVariant = 'default',
  presentation = 'full',
  showBack = false,
  onBack,
  onClear,
  clearLabel = 'Очистить',
  primaryAction,
  returnFocusRef,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  titleVariant?: 'default' | 'directions';
  presentation?: 'full' | 'compact';
  showBack?: boolean;
  onBack?: () => void;
  onClear?: () => void;
  clearLabel?: string;
  primaryAction?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    size?: FigmaButtonSize;
  };
  returnFocusRef?: { current: { focus?: () => void } | null };
  children: ReactNode;
}) {
  const { height } = useWindowDimensions();
  const compact = presentation === 'compact';
  const titleId = useId();
  const dialogId = `filter-sheet-${titleId}`;

  useDismissibleOverlay({
    open,
    onClose: () => onClose(),
    getSurfaces: () => [
      Platform.OS === 'web' ? document.getElementById(dialogId) : null,
    ],
  });
  useOverlayFocusTrap({
    open,
    surfaceId: dialogId,
    restoreOnClose: true,
    returnFocusRef,
  });

  return (
    <Modal
      visible={open}
      transparent
      animationType={compact ? 'slide' : 'none'}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          position: 'relative',
          alignItems: 'center',
          justifyContent: compact ? 'flex-end' : 'flex-start',
        }}
      >
        <OverlayDimmer onPress={onClose} />
        <View
          nativeID={dialogId}
          accessibilityViewIsModal
          accessibilityLabel={title}
          style={[filterSheetPanelStyle(compact), compact ? { maxHeight: height * 0.85 } : null]}
          {...(Platform.OS === 'web'
            ? ({ role: 'dialog', 'aria-modal': true } as object)
            : {})}
        >
          {compact ? (
            <View style={{ alignSelf: 'center', width: 36, height: 4, borderRadius: 10, backgroundColor: '#efefef', marginBottom: 16 }} />
          ) : null}
          <View
            style={[
              compact ? { width: '100%', minHeight: title ? 22 : 0, flexDirection: 'row' as const, alignItems: 'center' as const } : filterSheetHeaderStyle(),
              titleVariant === 'directions'
                ? {
                    minHeight:
                      designTokens.authorApplication.directionsHeaderHeight,
                  }
                : null,
            ]}
          >
            {!compact ? <MotionPressable
              accessibilityRole="button"
              accessibilityLabel={showBack ? 'Назад' : 'Закрыть'}
              hitSlop={figmaTokens.space.headerIconHitSlop}
              onPress={showBack ? (onBack ?? onClose) : onClose}
              preset="icon"
              style={{
                width: figmaTokens.size.buttonIconFrame,
                height: figmaTokens.size.buttonIconFrame,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FigmaIcon
                name={showBack ? 'arrow-left-01' : 'x'}
                size={figmaTokens.size.buttonIconFrame}
                strokeWidthPx={
                  titleVariant === 'directions' && showBack ? 2 : undefined
                }
              />
            </MotionPressable> : null}
            {title ? <AppText
              nativeID={titleId}
              role={compact ? 'body' : showBack ? 'profileHeading' : 'screenTitle'}
              numberOfLines={1}
              style={[
                compact ? { fontSize: 18, fontWeight: '600' as const } : filterSheetTitleStyle(),
                titleVariant === 'directions'
                  ? designTokens.typography.directionsSheetTitle
                  : null,
              ]}
            >
              {title}
            </AppText> : null}
            {onClear ? (
              <FigmaButton
                label={clearLabel}
                variant="ghost"
                onPress={onClear}
              />
            ) : compact ? null : (
              <View style={{ width: figmaTokens.size.iconButton }} />
            )}
          </View>
          <ScrollView
            style={{
              flex: compact ? undefined : 1,
              flexGrow: compact ? 0 : undefined,
              maxHeight: compact ? Math.max(height * 0.85 - 150, 80) : undefined,
              marginTop:
                compact ? 14 : titleVariant === 'directions' ? 0 : figmaTokens.space.x2,
            }}
            contentContainerStyle={{
              paddingTop:
                compact ? 0 : titleVariant === 'directions'
                  ? designTokens.authorApplication.directionsSearchGap
                  : figmaTokens.space.identityGap,
              paddingBottom: compact ? 0 : figmaTokens.space.x4,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
          {primaryAction ? (
            <FilterSheetActionRow
              primaryLabel={primaryAction.label}
              onPrimary={primaryAction.onPress}
              primaryDisabled={primaryAction.disabled}
              primaryLoading={primaryAction.loading}
              size={primaryAction.size}
              variant={titleVariant}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
