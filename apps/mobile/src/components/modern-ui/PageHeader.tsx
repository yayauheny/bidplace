import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppText } from './AppText';

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <View style={{ gap: designTokens.space.x2 }}>
      <AppText role="screenTitle">{title}</AppText>
      {description ? (
        <AppText role="bodySmall" tone="secondary">
          {description}
        </AppText>
      ) : null}
    </View>
  );
}
