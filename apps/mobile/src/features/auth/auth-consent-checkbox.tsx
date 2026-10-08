import { Pressable, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { designTokens } from '@bidplace/design-tokens';

import { AppText } from '../../components/ui';

const CHECK_PATH =
  'M 0 4.172800263061526 L 1.7238869251900724 5.971200591939304 C 2.168333638395593 6.43486729152363 2.3905535379287204 6.6666669845581055 2.666693551201596 6.6666669845581055 C 2.9428335644744714 6.6666669845581055 3.1650601794647013 6.43486729152363 3.6095335558164674 5.971200591939304 L 9.333333969116211 0';

export function AuthConsentCheckbox({
  checked,
  onChange,
  error,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}) {
  return (
    <View style={{ gap: designTokens.space.fieldErrorGap, width: '100%' }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        aria-checked={checked}
        accessibilityLabel="Я соглашаюсь с политикой конфиденциальности и правилами сервиса"
        onPress={() => onChange(!checked)}
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: designTokens.auth.titleGap,
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            padding: 1,
            backgroundImage: 'linear-gradient(#D1D1D1 0%, #EBEBEB 100%)',
          }}
        >
          <View
            style={{
              flex: 1,
              borderRadius: 5,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: checked
                ? designTokens.color.fieldValue
                : designTokens.color.canvas,
            }}
          >
            {checked ? (
              <Svg width={9.33} height={6.67} viewBox="0 0 9.333334 6.666667">
                <Path
                  d={CHECK_PATH}
                  stroke={designTokens.color.canvas}
                  strokeWidth={1.5}
                  fill="none"
                />
              </Svg>
            ) : null}
          </View>
        </View>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ flex: 1 }}
        >
          <AppText
            role="bodySmall"
            style={{
              color: designTokens.color.gray2,
              ...designTokens.typography.authConsent,
            }}
          >
            Я соглашаюсь с политикой конфиденциальности и правилами сервиса
          </AppText>
        </View>
      </Pressable>
      {error ? (
        <AppText role="bodySmall" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
