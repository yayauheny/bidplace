import type * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Pressable } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

import { useAppThemePalette } from '../../theme/palette';
import { mobileRadius, mobileSpacing } from '../../theme/tokens';

type SelectedLotImagesProps = {
  images: readonly ImagePicker.ImagePickerAsset[];
  onRemove: (imageKey: string) => void;
};

function getImageKey(asset: ImagePicker.ImagePickerAsset): string {
  return asset.assetId ?? asset.uri;
}

export function SelectedLotImages({
  images,
  onRemove,
}: SelectedLotImagesProps) {
  const palette = useAppThemePalette();

  if (images.length === 0) {
    return null;
  }

  return (
    <YStack style={{ gap: mobileSpacing[2] }}>
      <Text style={{ fontSize: 12, lineHeight: 16, color: palette.textMuted }}>
        Выбрано изображений: {images.length}
      </Text>
      <XStack style={{ gap: mobileSpacing[2], flexWrap: 'wrap' }}>
        {images.map((image) => {
          const imageKey = getImageKey(image);

          return (
            <YStack
              key={imageKey}
              style={{
                width: 104,
                gap: mobileSpacing[1],
              }}
            >
              <YStack
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: mobileRadius.md,
                  aspectRatio: 1,
                  backgroundColor: palette.surfaceMuted,
                }}
              >
                <Image
                  source={{ uri: image.uri }}
                  accessibilityLabel={image.fileName ?? 'Выбранное изображение'}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Удалить изображение"
                  onPress={() => onRemove(imageKey)}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 28,
                    height: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 14,
                    backgroundColor: palette.danger,
                  }}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 18,
                      lineHeight: 18,
                      fontWeight: '700',
                    }}
                  >
                    ×
                  </Text>
                </Pressable>
              </YStack>
              <Text
                style={{ fontSize: 11, lineHeight: 14, color: palette.textMuted }}
                numberOfLines={1}
              >
                {image.fileName ?? 'image'}
              </Text>
            </YStack>
          );
        })}
      </XStack>
    </YStack>
  );
}
