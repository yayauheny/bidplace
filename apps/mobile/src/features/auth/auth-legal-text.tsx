import { useRef } from 'react';
import type { TextStyle } from 'react-native';
import { Platform, Text } from 'react-native';

import { appTextRoleStyle } from '../../components/ui/app-text-role-style';
import { useAppTheme } from '../../providers/theme-provider';

type AuthLegalTextProps = {
  variant: 'consent' | 'login';
  onOpenPolicy: () => void;
  onOpenRules: () => void;
  textAlign?: TextStyle['textAlign'];
};

function focusLegalLink(node: unknown) {
  if (Platform.OS !== 'web' || !(node instanceof HTMLElement)) return;
  node.focus({ preventScroll: true });
}

function LegalLink({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const palette = useAppTheme();
  const hostRef = useRef<unknown>(null);
  const activate = () => {
    focusLegalLink(hostRef.current);
    onPress();
  };
  const handleKeyDown = (event: { key: string; preventDefault: () => void }) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    activate();
  };

  return (
    <Text
      ref={(node) => {
        hostRef.current = node;
      }}
      accessibilityRole="link"
      onPress={activate}
      {...(Platform.OS === 'web' ? ({ onKeyDown: handleKeyDown, tabIndex: 0 } as object) : {})}
      style={{ color: palette.fieldValue }}
    >
      {label}
    </Text>
  );
}

export function AuthLegalText({
  variant,
  onOpenPolicy,
  onOpenRules,
  textAlign = 'left',
}: AuthLegalTextProps) {
  const role = variant === 'consent' ? 'authConsent' : 'authLegal';
  const palette = useAppTheme();

  return (
    <Text
      style={[
        appTextRoleStyle(role, Platform.OS) as TextStyle,
        { color: palette.gray2, textAlign, flex: 1 },
      ]}
    >
      {variant === 'consent' ? (
        <>
          Я соглашаюсь с{' '}
          <LegalLink label="политикой конфиденциальности" onPress={onOpenPolicy} />
          {' '}и{' '}
          <LegalLink label="правилами сервиса" onPress={onOpenRules} />
        </>
      ) : (
        <>
          Ознакомьтесь с{' '}
          <LegalLink label="политикой персональных данных и cookies" onPress={onOpenPolicy} />
          {' '}и{' '}
          <LegalLink label="пользовательским соглашением" onPress={onOpenRules} />
        </>
      )}
    </Text>
  );
}
