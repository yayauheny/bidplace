import { useId, type ReactNode } from 'react';
import * as Dialog from '@rn-primitives/dialog';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { designTokens, type FigmaButtonSize } from '@bidplace/design-tokens';

import { AppDialog } from '../ui/AppDialog';
import { SheetDragHandle } from '../ui/SheetDragSurface';
import { appDialogSheetBottomSpace } from '../ui/app-dialog-host-style';
import { AppText } from '../ui/AppText';
import { MotionPressable } from '../ui/MotionPressable';
import { useAppTheme } from '../../providers/theme-provider';
import { BackButton } from './BackButton';
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
  const palette = useAppTheme();

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      returnFocusRef={returnFocusRef}
      presentation="sheet"
      bare
      bottomSpace={compact ? (bottomSpace ?? designTokens.space.x5) : undefined}
    >
      <View
        style={filterSheetPanelStyle(
          compact,
          height,
          primaryAction ? insets.bottom : 0,
          palette,
        )}
      >
        <SheetDragHandle>
          {compact ? (
            <View
              style={{
                alignSelf: 'center',
                width: 36,
                height: 4,
                borderRadius: 10,
                backgroundColor: palette.quietFill,
                marginBottom: 16,
              }}
            />
          ) : null}
          <View
            style={[
              compact
                ? {
                    width: '100%',
                    minHeight: showBack
                      ? designTokens.size.touch
                      : title
                        ? 22
                        : 0,
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
            {showBack ? (
              <BackButton onPress={onBack ?? onClose} />
            ) : !compact ? (
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel="Закрыть"
                hitSlop={designTokens.space.headerIconHitSlop}
                onPress={onClose}
                preset="icon"
                style={{
                  width: designTokens.size.buttonIconFrame,
                  height: designTokens.size.buttonIconFrame,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FigmaIcon
                  name="x"
                  size={designTokens.size.buttonIconFrame}
                  strokeWidthPx={
                    titleVariant === 'directions' && showBack
                      ? designTokens.stroke.iconHeavy
                      : undefined
                  }
                />
              </MotionPressable>
            ) : null}
            {title ? (
              <Dialog.Title asChild>
                <AppText
                  nativeID={titleId}
                  role={
                    compact
                      ? 'pickerTitle'
                      : showBack
                        ? 'profileHeading'
                        : 'screenTitle'
                  }
                  numberOfLines={1}
                  style={[
                    filterSheetTitleStyle(),
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
              <FigmaButton
                label={clearLabel}
                variant="ghost"
                onPress={onClear}
              />
            ) : compact ? null : (
              <View style={{ width: designTokens.size.iconButton }} />
            )}
          </View>
        </SheetDragHandle>
        <ScrollView
          style={{
            flex: compact ? undefined : 1,
            flexGrow: compact ? 0 : undefined,
            marginTop: compact
              ? 14
              : titleVariant === 'directions'
                ? 0
                : designTokens.space.x2,
          }}
          contentContainerStyle={{
            paddingTop: compact
              ? 0
              : titleVariant === 'directions'
                ? designTokens.authorApplication.directionsSearchGap
                : designTokens.space.identityGap,
            paddingBottom: compact
              ? 0
              : appDialogSheetBottomSpace(
                  designTokens.space.x4,
                  primaryAction ? 0 : insets.bottom,
                ),
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
