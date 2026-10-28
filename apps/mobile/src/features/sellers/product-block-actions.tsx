import { useId, useEffect, useLayoutEffect, useRef, useState, type ElementRef, type ReactNode } from 'react';
import { Platform, View, type ViewStyle } from 'react-native';
import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg';
import { designTokens } from '@bidplace/design-tokens';
import { figmaButtonStrokeRadius } from '../../components/figma/figma-button-style';
import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import type { MotionPressable } from '../../components/ui/MotionPressable';
import { useAppTheme } from '../../providers/theme-provider';

const menuPanelRadius = 31;
const menuDividerLength = 26;
const menuStroke = 0.5;

const menuPanelShadowStyle = (
  palette: ReturnType<typeof useAppTheme>,
): ViewStyle =>
  Platform.OS === 'web'
    ? { boxShadow: '0 4px 26px rgba(0, 0, 0, 0.05)' }
    : {
        shadowColor: palette.ink,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 26,
      };

function OutlineGradient({
  width,
  height,
  radius,
  start,
  end,
  testID,
}: {
  width: number;
  height: number;
  radius?: number;
  start: string;
  end: string;
  testID: string;
}) {
  const gradientId = useId().replace(/:/g, '');
  if (width <= 0 || height <= 0) return null;
  const stroke = radius == null ? 0 : menuStroke;
  const capsule =
    radius == null
      ? 0
      : figmaButtonStrokeRadius({
          borderRadius: radius,
          width,
          height,
          strokeWidth: stroke,
        });
  return (
    <Svg
      pointerEvents="none"
      testID={testID}
      width={width}
      height={height}
      style={
        radius == null
          ? undefined
          : { position: 'absolute', top: 0, left: 0 }
      }
    >
      <Defs>
        <LinearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="0"
          y2={height}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={start} />
          <Stop offset="1" stopColor={end} />
        </LinearGradient>
      </Defs>
      <Rect
        x={stroke / 2}
        y={stroke / 2}
        width={Math.max(0, width - stroke)}
        height={Math.max(0, height - stroke)}
        rx={radius == null ? undefined : capsule}
        ry={radius == null ? undefined : capsule}
        fill={radius == null ? `url(#${gradientId})` : 'none'}
        stroke={radius == null ? undefined : `url(#${gradientId})`}
        strokeWidth={radius == null ? undefined : stroke}
      />
    </Svg>
  );
}

/** One action owner for story blocks and gallery photos; mutation ownership stays in the editor. */
export function ProductBlockActions({
  children,
  kind,
  editable,
  disabled,
  first,
  last,
  onMove,
  onDelete,
  details,
  variant,
  open: controlledOpen,
  onOpenChange,
  active = true,
  blockKey,
}: {
  children: ReactNode;
  kind: 'text' | 'image';
  editable: boolean;
  disabled: boolean;
  first: boolean;
  last: boolean;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
  details?: ReactNode;
  variant: 'story' | 'tile';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  active?: boolean;
  blockKey?: string;
}) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen ?? localOpen;
  const setOpen = (value: boolean) =>
    onOpenChange ? onOpenChange(value) : setLocalOpen(value);
  const menu = useRef<View>(null);
  const detailsPanel = useRef<View>(null);
  const palette = useAppTheme();
  const trigger = useRef<ElementRef<typeof MotionPressable>>(null);
  const up = useRef<ElementRef<typeof MotionPressable>>(null);
  const down = useRef<ElementRef<typeof MotionPressable>>(null);
  const moved = useRef<-1 | 1 | null>(null);
  const [panelBox, setPanelBox] = useState<{
    width: number;
    height: number;
  } | null>(null);
  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    const element = menu.current as unknown as HTMLElement | null;
    const outside = (event: PointerEvent) => {
      const panel = detailsPanel.current as unknown as HTMLElement | null;
      if (
        !element?.contains(event.target as Node) &&
        !panel?.contains(event.target as Node)
      )
        setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  });
  useLayoutEffect(() => {
    if (!open || moved.current === null) return;
    const direction = moved.current;
    moved.current = null;
    let target = direction === -1 ? up : down;
    if (disabled || (first && last)) target = trigger;
    else if (direction === -1 && first) target = down;
    else if (direction === 1 && last) target = up;
    target.current?.focus();
  });
  const move = (direction: -1 | 1) => {
    moved.current = direction;
    onMove(direction);
  };
  const run = (action: () => void, close = true) => {
    if (disabled) return;
    if (close) setOpen(false);
    action();
  };
  return (
    <View
      {...(Platform.OS === 'web'
        ? {
            dataSet: {
              editorBlock: kind,
              ...(blockKey ? { blockKey } : {}),
            },
          }
        : {})}
      style={{ gap: designTokens.space.x2, overflow: 'visible' }}
    >
      <View style={{ position: 'relative', overflow: 'visible' }}>
        {children}
        {editable && variant === 'tile' ? (
          <View
            style={{
              position: 'absolute',
              // Center the 38px visual inside native hit bounds, retaining its 8px inset.
              bottom:
                designTokens.space.x2 - (designTokens.size.touch - 38) / 2,
              right: designTokens.space.x2 - (designTokens.size.touch - 38) / 2,
              width: designTokens.size.touch,
              height: designTokens.size.touch,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FigmaIconButton
              icon="delete-02"
              label="Удалить фото"
              surface="destructive"
              disabled={disabled}
              onPress={() => run(onDelete)}
            />
          </View>
        ) : null}
        {editable && active ? (
          <View
            ref={menu}
            onTouchStart={(event) => event.stopPropagation()}
            {...(Platform.OS === 'web'
              ? { dataSet: { blockMenu: 'true', blockMenuOpen: String(open) } }
              : {})}
            style={{
              position: 'absolute',
              zIndex: 1,
              // Enabled trigger still computed pointer-events:none and lost the click to the field.
              pointerEvents: 'auto',
              overflow: 'visible',
              right: kind === 'image' ? designTokens.space.x3 : 0,
              top: kind === 'image' ? designTokens.space.x3 : 0,
            }}
          >
            <FigmaIconButton
              ref={trigger}
              icon="more-vertical"
              label={
                kind === 'image'
                  ? 'Действия с изображением'
                  : 'Действия с блоком'
              }
              surface="muted"
              disabled={disabled}
              expanded={open}
              onPress={() => setOpen(!open)}
              {...(variant === 'story' ? { frame: designTokens.size.touch, strokeWidthPx: designTokens.stroke.icon } : {})}
            />
            {open ? (
              <View
                onLayout={(event) => {
                  const { width, height } = event.nativeEvent.layout;
                  setPanelBox((prev) =>
                    prev && prev.width === width && prev.height === height
                      ? prev
                      : { width, height },
                  );
                }}
                style={{
                  position: 'absolute',
                  right: designTokens.space.x8,
                  top: -designTokens.space.x8,
                  borderRadius: menuPanelRadius,
                  ...menuPanelShadowStyle(palette),
                }}
              >
                <View
                  accessibilityRole="toolbar"
                  accessibilityLabel="Порядок блока"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    padding: designTokens.space.x1,
                    borderRadius: menuPanelRadius,
                    backgroundColor: palette.surfaceMuted,
                  }}
                >
                  {variant === 'story' ? (
                    <FigmaIconButton
                      frame={designTokens.size.touch}
                      label="Удалить"
                      icon="delete-02"
                      iconSize={18}
                      strokeWidthPx={designTokens.stroke.icon}
                      tone="danger"
                      disabled={disabled}
                      onPress={() => run(onDelete)}
                    />
                  ) : null}
                  <OutlineGradient
                    testID="story-menu-divider"
                    width={1}
                    height={menuDividerLength}
                    start={palette.outlineBorderGradientStart}
                    end={palette.outlineBorderGradientEnd}
                  />
                  <View
                    style={{ flexDirection: 'row', gap: designTokens.space.x1 }}
                  >
                    <FigmaIconButton
                      size="compact"
                      ref={up}
                      label="Выше"
                      icon="arrow-up-01"
                      iconSize={18}
                      strokeWidthPx={designTokens.stroke.icon}
                      disabled={disabled || first}
                      onPress={() => run(() => move(-1), false)}
                    />
                    <FigmaIconButton
                      size="compact"
                      ref={down}
                      label="Ниже"
                      icon="arrow-down-01"
                      iconSize={18}
                      strokeWidthPx={designTokens.stroke.icon}
                      disabled={disabled || last}
                      onPress={() => run(() => move(1), false)}
                    />
                  </View>
                </View>
                {panelBox ? (
                  <OutlineGradient
                    testID="story-menu-stroke"
                    width={panelBox.width}
                    height={panelBox.height}
                    radius={menuPanelRadius}
                    start={palette.outlineBorderGradientStart}
                    end={palette.outlineBorderGradientEnd}
                  />
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      {open && editable && details ? (
        <View
          ref={detailsPanel}
          onTouchStart={(event) => event.stopPropagation()}
          style={{
            position: 'absolute',
            top: designTokens.size.touch,
            right: 0,
            width: '100%',
            padding: designTokens.space.x2,
            backgroundColor: palette.surface,
          }}
        >
          {details}
        </View>
      ) : null}
    </View>
  );
}
