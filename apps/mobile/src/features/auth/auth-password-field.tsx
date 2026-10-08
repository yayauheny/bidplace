import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { FigmaIcon } from '../../components/figma/FigmaIcon';
import { TextField } from '../../components/ui';
import { MotionPressable } from '../../components/ui/MotionPressable';

export function AuthPasswordField({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  autoComplete,
  metrics = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur: () => void;
  error?: string;
  autoComplete: 'current-password' | 'new-password';
  metrics?: 'default' | 'authPassword' | 'authScreenPassword';
}) {
  const inputRef = useRef<TextInput>(null);
  const selection = useRef({ start: value.length, end: value.length });
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      ref={inputRef}
      label={label}
      value={value}
      onChangeText={onChangeText}
      onBlur={onBlur}
      placeholder={label}
      autoComplete={autoComplete}
      secureTextEntry={!visible}
      metrics={metrics}
      error={error}
      onSelectionChange={(event) => {
        selection.current = event.nativeEvent.selection;
      }}
      trailing={
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Скрыть пароль' : 'Показать пароль'}
          onPress={() => {
            const next = !visible;
            setVisible(next);
            const { start, end } = selection.current;
            requestAnimationFrame(() => {
              inputRef.current?.focus();
              inputRef.current?.setSelection(start, end);
            });
          }}
          preset="icon"
          style={{
            width: designTokens.size.buttonIconFrame,
            height: designTokens.size.buttonIconFrame,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View pointerEvents="none">
            <FigmaIcon name={visible ? 'eye-off' : 'view'} size={designTokens.size.icon} />
          </View>
        </MotionPressable>
      }
    />
  );
}
