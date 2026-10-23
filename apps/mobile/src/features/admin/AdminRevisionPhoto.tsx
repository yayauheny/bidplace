import { useEffect, useRef, useState } from 'react';
import { Image, type ImageStyle } from 'expo-image';
import type { StyleProp } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppText } from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';

function useAdminObjectUrl(mediaKey: string, load: () => Promise<Blob>) {
  const loadRef = useRef(load);
  loadRef.current = load;
  const [uri, setUri] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    setUri(null);
    setFailed(false);
    void loadRef
      .current()
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setUri(objectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mediaKey]);

  return {
    uri,
    failed,
    onDecodeError: () => setFailed(true),
  };
}

function AdminObjectImage({
  label,
  uri,
  failed,
  onDecodeError,
  pendingLabel,
  errorLabel,
  contentFit,
  style,
}: {
  label: string;
  uri: string | null;
  failed: boolean;
  onDecodeError: () => void;
  pendingLabel: string;
  errorLabel: string;
  contentFit: 'cover' | 'contain';
  style?: StyleProp<ImageStyle>;
}) {
  if (failed) {
    return (
      <AppText role="bodySmall" tone="danger">
        {errorLabel}
      </AppText>
    );
  }
  if (!uri) {
    return (
      <AppText role="bodySmall" tone="secondary">
        {pendingLabel}
      </AppText>
    );
  }
  return (
    <Image
      source={{ uri }}
      accessibilityLabel={label}
      onError={onDecodeError}
      contentFit={contentFit}
      style={[
        {
          ...(style ? {} : { width: 96, height: 96 }),
          borderRadius: designTokens.radius.image,
        },
        style,
      ]}
    />
  );
}

export function AdminRevisionPhoto({
  profileId,
  revisionId,
  updatedAt,
  checksum,
  label,
  style,
}: {
  profileId: string;
  revisionId: string;
  updatedAt: string;
  checksum: string;
  label: string;
  style?: StyleProp<ImageStyle>;
}) {
  const api = useApiClient();
  const view = useAdminObjectUrl(
    `${profileId}:${revisionId}:${updatedAt}:${checksum}`,
    () => api.admin.getSellerRevisionPhoto(profileId, revisionId),
  );
  return (
    <AdminObjectImage
      {...view}
      label={label}
      pendingLabel="Загрузка фото ревизии"
      errorLabel="Фото ревизии недоступно"
      style={style}
      contentFit="cover"
    />
  );
}

export function AdminReviewImage({
  imageId,
  checksum,
  label,
  fallbackLabel,
  style,
}: {
  imageId: string;
  checksum: string;
  label: string;
  fallbackLabel: string;
  style?: StyleProp<ImageStyle>;
}) {
  const api = useApiClient();
  const view = useAdminObjectUrl(`${imageId}:${checksum}`, () =>
    api.admin.getProductImage(imageId),
  );
  return (
    <AdminObjectImage
      {...view}
      label={label}
      pendingLabel="Загрузка изображения"
      errorLabel={fallbackLabel}
      style={style}
      contentFit="contain"
    />
  );
}

export function AdminAchievementImage({ id, checksum, label, style }: { id: string; checksum: string; label: string; style?: StyleProp<ImageStyle> }) {
  const api = useApiClient();
  const view = useAdminObjectUrl(`${id}:${checksum}`, () => api.admin.getAchievementImage(id));
  return <AdminObjectImage {...view} label={label} style={style} pendingLabel="Загрузка достижения" errorLabel="Изображение достижения недоступно" contentFit="contain" />;
}
