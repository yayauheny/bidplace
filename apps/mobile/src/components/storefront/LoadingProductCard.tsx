import { YStack } from 'tamagui';

import { mobileSpacing } from '../../theme/tokens';

export function LoadingProductCard() {
  return (
    <YStack gap={mobileSpacing[2]}>
      <YStack style={{ aspectRatio: 4 / 5, backgroundColor: '#F0F0EE', opacity: 0.75 }} />
      <YStack style={{ width: '76%', height: 14, backgroundColor: '#F4F2ED' }} />
      <YStack style={{ width: '42%', height: 12, backgroundColor: '#F4F2ED' }} />
    </YStack>
  );
}
