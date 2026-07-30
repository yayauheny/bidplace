import { View } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

import { AppText } from './AppText';

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <View style={{ gap: modernTokens.space.x2 }}>
      <AppText role="screenTitle">{title}</AppText>
      {description ? (
        <AppText role="bodySmall" tone="secondary">
          {description}
        </AppText>
      ) : null}
    </View>
  );
}
