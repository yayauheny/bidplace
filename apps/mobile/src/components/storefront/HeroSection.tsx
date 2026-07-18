import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable } from 'react-native';
import { Text, YStack, useMedia } from 'tamagui';

import { mobileRadius, mobileSpacing } from '../../theme/tokens';
import { AppButton } from '../ui';

type HeroSectionProps = {
  imageUrl: string;
};

export function HeroSection({ imageUrl }: HeroSectionProps) {
  const media = useMedia();

  return (
    <YStack
      style={{
        position: 'relative',
        minHeight: media.mobile ? 520 : 640,
        borderRadius: mobileRadius.lg,
        overflow: 'hidden',
      }}
    >
      <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      <YStack
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: mobileSpacing[4],
          backgroundColor: 'rgba(17, 17, 17, 0.18)',
          gap: mobileSpacing[4],
        }}
      >
        <Text
          color="$surface"
          fontFamily="$heading"
          style={{
            textAlign: 'center',
            fontSize: media.mobile ? 42 : 68,
            lineHeight: media.mobile ? 46 : 72,
            maxWidth: 780,
          }}
        >
          Современный сервис для осознанного выбора
        </Text>
        <Link href="/catalog" asChild>
          <Pressable accessibilityRole="link">
            <AppButton buttonSize="large">Смотреть каталог</AppButton>
          </Pressable>
        </Link>
      </YStack>
    </YStack>
  );
}
