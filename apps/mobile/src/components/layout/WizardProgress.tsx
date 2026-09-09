import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppText } from '../ui/AppText';
import { BackButton, IconButton } from '../ui/Button';

export function WizardProgress({
  step,
  total,
  title,
  description,
  onBack,
  onClose,
}: {
  step: number;
  total: number;
  title: string;
  description?: string;
  onBack?: () => void;
  onClose?: () => void;
}) {
  return (
    <View style={{ gap: designTokens.space.x3 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {onBack ? <BackButton onPress={onBack} /> : <View style={{ width: 44 }} />}
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 1, max: total, now: step }}
          style={{ flexDirection: 'row', gap: 8 }}
        >
          {Array.from({ length: total }, (_, index) => (
            <View
              key={index}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  index + 1 === step
                    ? designTokens.color.ink
                    : designTokens.color.mutedFill,
              }}
            />
          ))}
        </View>
        {onClose ? (
          <IconButton icon="x" label="Закрыть" onPress={onClose} />
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>
      <AppText role="screenTitle">{title}</AppText>
      {description ? (
        <AppText role="bodySmall" tone="secondary">
          {description}
        </AppText>
      ) : null}
    </View>
  );
}
