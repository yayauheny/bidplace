import { useState, type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import { SecondaryButton } from '../../components/ui';

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
}) {
  const [open, setOpen] = useState(false);
  const run = (action: () => void) => {
    if (disabled) return;
    setOpen(false);
    action();
  };
  return (
    <View
      {...(Platform.OS === 'web' ? { dataSet: { editorBlock: kind } } : {})}
      style={{ gap: designTokens.space.x2 }}
    >
      <View style={{ position: 'relative' }}>
        {children}
        {editable && presentation === 'mediaTile' ? (
          <View
            style={{
              position: 'absolute',
              // Center the 38px visual inside native hit bounds, retaining its 8px inset.
              bottom: designTokens.space.x2 - (designTokens.size.touch - 38) / 2,
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
            {...(Platform.OS === 'web'
              ? { dataSet: { blockMenu: 'true', blockMenuOpen: String(open) } }
              : {})}
            style={{
              position: 'absolute',
              right: kind === 'image' ? designTokens.space.x3 : 0,
              top: kind === 'image' ? designTokens.space.x3 : 0,
            }}
          >
            <FigmaIconButton
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
          </View>
        ) : null}
      </View>
      {open && editable ? (
        <View style={{ gap: designTokens.space.x2 }}>
          <View
            style={{
              alignSelf: 'flex-end',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: designTokens.space.x2,
            }}
          >
            <SecondaryButton
              label="Выше"
              icon="arrow-up-01"
              disabled={disabled || first}
              onPress={() => run(() => onMove(-1))}
            />
            <SecondaryButton
              label="Ниже"
              icon="arrow-down-01"
              disabled={disabled || last}
              onPress={() => run(() => onMove(1))}
            />
            {presentation === 'menu' ? (
              <SecondaryButton
                label="Удалить"
                icon="delete-02"
                disabled={disabled}
                onPress={() => run(onDelete)}
              />
            ) : null}
          </View>
          {details}
        </View>
      ) : null}
    </View>
  );
}
