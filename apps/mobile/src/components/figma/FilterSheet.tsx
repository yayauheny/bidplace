import { useId, type ReactNode } from 'react';
import * as Dialog from '@rn-primitives/dialog';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  designTokens,
  figmaTokens,
  type FigmaButtonSize,
} from '@bidplace/design-tokens';

import { AppDialog } from '../ui/AppDialog';
import { appDialogSheetBottomSpace } from '../ui/app-dialog-host-style';
import { AppText } from '../ui/AppText';
import { MotionPressable } from '../ui/MotionPressable';
import { FigmaButton } from './FigmaButton';
import { FigmaIcon } from './FigmaIcon';
import { FilterSheetActionRow } from './FilterSheetActionRow';
import {
  filterSheetHeaderStyle,
  filterSheetPanelStyle,
  filterSheetTitleStyle,
} from './filter-sheet-style';

export function FilterSheet({
  open,
  onClose,
  title,
  accessibilityLabel = title,
  titleVariant = 'default',
  presentation = 'full',
  bottomSpace,
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
  accessibilityLabel?: string;
  titleVariant?: 'default' | 'directions';
  presentation?: 'full' | 'compact';
  bottomSpace?: 20 | 40;
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
  const compact = presentation === 'compact';
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const titleId = useId();

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      returnFocusRef={returnFocusRef}
      presentation="sheet"
      bare
      bottomSpace={compact ? (bottomSpace ?? figmaTokens.space.x5) : undefined}
    >
      <View style={filterSheetPanelStyle(compact, height)}>
        {compact ? (
          <View
            style={{
              alignSelf: 'center',
              width: 36,
              height: 4,
              borderRadius: 10,
              backgroundColor: '#efefef',
              marginBottom: 16,
            }}
          />
        ) : null}
        <View
          style={[
            compact
              ? {
                  width: '100%',
                  minHeight: title ? 22 : 0,
                  flexDirection: 'row',
                  alignItems: 'center',
                }
              : filterSheetHeaderStyle(),
            titleVariant === 'directions'
              ? {
                  minHeight:
                    designTokens.authorApplication.directionsHeaderHeight,
                }
              : null,
          ]}
        >
          {!compact ? (
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
          {title ? (
            <Dialog.Title asChild>
              <AppText
                nativeID={titleId}
                role={
                  compact ? 'body' : showBack ? 'profileHeading' : 'screenTitle'
                }
                numberOfLines={1}
                style={[
                  compact
                    ? { fontSize: 18, fontWeight: '600' as const }
                    : filterSheetTitleStyle(),
                  titleVariant === 'directions'
                    ? designTokens.typography.directionsSheetTitle
                    : null,
                ]}
              >
                {title}
              </AppText>
            </Dialog.Title>
          ) : (
            <Dialog.Title asChild>
              <AppText style={{ position: 'absolute', opacity: 0 }}>
                {accessibilityLabel}
              </AppText>
            </Dialog.Title>
          )}
          {onClear ? (
            <FigmaButton label={clearLabel} variant="ghost" onPress={onClear} />
          ) : compact ? null : (
            <View style={{ width: figmaTokens.size.iconButton }} />
          )}
        </View>
        <ScrollView
          style={{
            flex: compact ? undefined : 1,
            flexGrow: compact ? 0 : undefined,
            marginTop: compact
              ? 14
              : titleVariant === 'directions'
                ? 0
                : figmaTokens.space.x2,
          }}
          contentContainerStyle={{
            paddingTop: compact
              ? 0
              : titleVariant === 'directions'
                ? designTokens.authorApplication.directionsSearchGap
                : figmaTokens.space.identityGap,
            paddingBottom: compact
              ? 0
              : appDialogSheetBottomSpace(figmaTokens.space.x4, insets.bottom),
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
    </AppDialog>
  );
}
