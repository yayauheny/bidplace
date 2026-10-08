import type { TextStyle } from 'react-native';
import { Platform, Text } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { appTextRoleStyle } from '../../components/ui/app-text-role-style';

export const AUTH_POLICY_STUB_TITLE = 'Политика конфиденциальности';
export const AUTH_POLICY_STUB_BODY = 'Документ готовится';

type AuthLegalTextProps = {
  variant: 'consent' | 'login';
  onOpenPolicy: () => void;
  onOpenRules: () => void;
  textAlign?: TextStyle['textAlign'];
};

const linkStyle = {
  color: designTokens.color.fieldValue,
} as const;

const mutedStyle = {
  color: designTokens.color.gray2,
} as const;

function LegalLink({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const handleKeyDown = (event: { key: string; preventDefault: () => void }) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onPress();
  };

  return (
    <Text
      accessibilityRole="link"
      onPress={onPress}
      {...(Platform.OS === 'web' ? ({ onKeyDown: handleKeyDown, tabIndex: 0 } as object) : {})}
      style={linkStyle}
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

  return (
    <Text
      style={[
        appTextRoleStyle(role, Platform.OS) as TextStyle,
        mutedStyle,
        { textAlign, flex: 1 },
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
          Продолжая, вы принимаете{' '}
          <LegalLink label="политику конфиденциальности" onPress={onOpenPolicy} />
          {' '}и{' '}
          <LegalLink label="правила сервиса" onPress={onOpenRules} />
        </>
      )}
    </Text>
  );
}
