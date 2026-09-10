import { Text, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import {
  PAYMENT_DELIVERY_STUB,
  PAYMENT_DELIVERY_TITLE,
} from './payment-delivery-stub';

export function PaymentDeliveryStub() {
  return (
    <View style={{ gap: figmaTokens.space.x2, width: '100%' }}>
      <Text
        style={[
          { color: figmaTokens.color.ink },
          figmaTokens.typography.label,
        ]}
      >
        {PAYMENT_DELIVERY_TITLE}
      </Text>
      <Text
        style={[
          { color: figmaTokens.color.textSecondary },
          figmaTokens.typography.bodySmall,
        ]}
      >
        {PAYMENT_DELIVERY_STUB}
      </Text>
    </View>
  );
}
