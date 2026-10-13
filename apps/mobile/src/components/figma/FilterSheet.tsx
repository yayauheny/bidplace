import { useId, type ReactNode } from 'react';
import { Modal, Platform, ScrollView, View } from 'react-native';

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
  compact = false,
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
  compact?: boolean;
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
      animationType="none"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          position: 'relative',
          alignItems: 'center',
          justifyContent: compact ? 'flex-end' : undefined,
        }}
      >
        <OverlayDimmer onPress={onClose} />
        <View
          nativeID={dialogId}
          accessibilityViewIsModal
          accessibilityLabel={title}
          style={filterSheetPanelStyle(compact)}
          {...(Platform.OS === 'web'
            ? ({ role: 'dialog', 'aria-modal': true } as object)
            : {})}
        >
          {compact ? (
            <View style={{ alignItems: 'center', height: 14 }}>
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 4,
                  backgroundColor: figmaTokens.color.muted,
                }}
              />
            </View>
          ) : null}
          <View
            style={[
              filterSheetHeaderStyle(compact),
              titleVariant === 'directions'
                ? {
                    minHeight:
                      designTokens.authorApplication.directionsHeaderHeight,
                  }
                : null,
            ]}
          >
            {!compact || showBack ? (
              <MotionPressable
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
              </MotionPressable>
            ) : null}
            <AppText
              nativeID={titleId}
              role={compact ? 'body' : showBack ? 'profileHeading' : 'screenTitle'}
              numberOfLines={1}
              style={[
                filterSheetTitleStyle(),
                compact ? { fontWeight: '600', fontSize: 16 } : null,
                titleVariant === 'directions'
                  ? designTokens.typography.directionsSheetTitle
                  : null,
              ]}
            >
              {title}
            </AppText>
            {onClear ? (
              <FigmaButton
                label={clearLabel}
                variant="ghost"
                onPress={onClear}
              />
            ) : (
              compact ? null : (
                <View style={{ width: figmaTokens.size.iconButton }} />
              )
            )}
          </View>
          <ScrollView
            style={
              compact
                ? { flexShrink: 1, marginTop: figmaTokens.space.x2 }
                : {
                    flex: 1,
                    marginTop:
                      titleVariant === 'directions' ? 0 : figmaTokens.space.x2,
                  }
            }
            contentContainerStyle={{
              paddingTop: compact
                ? 0
                : titleVariant === 'directions'
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
