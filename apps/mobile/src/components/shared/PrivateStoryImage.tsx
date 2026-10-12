import { useEffect, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { View, type ImageStyle } from 'react-native';

import { AppText } from '../ui';
import { useApiClient } from '../../providers/api-provider';

/**
 * Preview a private Work Story asset using the authenticated API client.
 * Never put bearer credentials in a public image URL.
 */
export function PrivateStoryImage({
  productId,
  mediaAssetId,
  galleryImageId,
  sessionEpoch,
  label,
  style,
}: {
  productId: string;
  mediaAssetId: string;
  galleryImageId?: string;
  sessionEpoch: number;
  label: string;
  style: ImageStyle;
}) {
  const api = useApiClient();
  const apiRef = useRef(api);
  apiRef.current = api;
  const mediaKey = `${sessionEpoch}:${productId}:${mediaAssetId}:${galleryImageId ?? ''}`;
  const [view, setView] = useState<{ key: string; uri: string | null; failed: boolean }>({
    key: '',
    uri: null,
    failed: false,
  });

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    const controller = new AbortController();
    setView({ key: mediaKey, uri: null, failed: false });
    const options = { signal: controller.signal };
    const load = galleryImageId
      ? apiRef.current.images.getImage(galleryImageId, options)
      : apiRef.current.images.getStoryImage(productId, mediaAssetId, options);
    void load.then((image) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(image);
      setView({ key: mediaKey, uri: objectUrl, failed: false });
    }).catch(() => {
      if (active) setView({ key: mediaKey, uri: null, failed: true });
    });
    return () => {
      active = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mediaKey, galleryImageId, productId, mediaAssetId]);

  if (view.key !== mediaKey || !view.uri || view.failed) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center' }]}>
        <AppText role="bodySmall" tone={view.key === mediaKey && view.failed ? 'danger' : 'secondary'}>
          {view.key === mediaKey && view.failed ? 'Фото истории недоступно' : 'Загрузка фото'}
        </AppText>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: view.uri }}
      accessibilityLabel={label}
      contentFit="cover"
      style={style}
      onError={() => setView((current) =>
        current.key === mediaKey ? { ...current, failed: true } : current,
      )}
    />
  );
}
