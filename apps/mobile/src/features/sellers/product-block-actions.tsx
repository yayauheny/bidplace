import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ElementRef,
  type ReactNode,
} from 'react';
import { Platform, View, type ViewStyle } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import { FigmaIcon } from '../../components/figma/FigmaIcon';
import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import { figmaIconButtonStyle } from '../../components/figma/figma-icon-button-style';
import type { MotionPressable } from '../../components/ui/MotionPressable';
import { MotionPressable as StoryBlockPressable } from '../../components/ui/MotionPressable';
import { useAppTheme } from '../../providers/theme-provider';

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

const menuDividerStyle = (palette: ReturnType<typeof useAppTheme>): ViewStyle =>
  Platform.OS === 'web'
    ? ({
        height: 26,
        width: 1,
        experimental_backgroundImage: `linear-gradient(to bottom, ${palette.outlineBorderGradientStart}, ${palette.outlineBorderGradientEnd})`,
      } as ViewStyle)
    : {
        height: 26,
        width: 1,
        backgroundColor: palette.toolbarBorder,
      };

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
  presentation = 'menu',
  open: controlledOpen,
  onOpenChange,
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
  presentation?: 'menu' | 'mediaTile';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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
      {...(Platform.OS === 'web' ? { dataSet: { editorBlock: kind } } : {})}
      style={{ gap: designTokens.space.x2, zIndex: open ? 2 : 0 }}
    >
      <View style={{ position: 'relative' }}>
        {children}
        {editable && presentation === 'mediaTile' ? (
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
        {editable ? (
          <View
            ref={menu}
            onTouchStart={(event) => event.stopPropagation()}
            {...(Platform.OS === 'web'
              ? { dataSet: { blockMenu: 'true', blockMenuOpen: String(open) } }
              : {})}
            style={{
              position: 'absolute',
              right: kind === 'image' ? designTokens.space.x3 : 0,
              top: kind === 'image' ? designTokens.space.x3 : -10,
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
            />
            {open ? (
              <View
                style={{
                  position: 'absolute',
                  right: designTokens.space.x8,
                  top: -designTokens.space.x8,
                  borderRadius: 31,
                  padding: 0.5,
                  ...(Platform.OS === 'web'
                    ? ({
                        experimental_backgroundImage: `linear-gradient(180deg, ${palette.outlineBorderGradientStart}, ${palette.outlineBorderGradientEnd})`,
                      } as ViewStyle)
                    : {
                        backgroundColor: palette.toolbarBorder,
                      }),
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
                    borderRadius: 31,
                    backgroundColor: palette.surfaceMuted,
                  }}
                >
                {presentation === 'menu' ? (
                  <StoryBlockPressable
                    accessibilityRole="button"
                    accessibilityLabel="Удалить"
                    disabled={disabled}
                    onPress={() => run(onDelete)}
                    preset="icon"
                    style={({ pressed }) => [
                      figmaIconButtonStyle(pressed, 'plain', palette),
                      {
                        width: designTokens.size.compactIconButton,
                        height: designTokens.size.compactIconButton,
                      },
                    ]}
                  >
                    <FigmaIcon
                      name="delete-02"
                      size={18}
                      strokeWidthPx={designTokens.stroke.icon}
                      color={palette.destructiveInk}
                    />
                  </StoryBlockPressable>
                ) : null}
                <View style={menuDividerStyle(palette)} />
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
