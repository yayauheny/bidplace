import { useEffect, useRef, useState } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

import { prepareImageUpload } from '../../lib/media/prepare-image-upload';

import type { SellerProfileResponse } from '@bidplace/contracts';

import { getApiAssetUrl } from '../../lib/environment';
import { canWritePrivateCache, currentAuthEpoch } from '../../lib/query-cache';
import type { useApiClient } from '../../providers/api-provider';
import type { ProfileOperationGuard } from './seller-profile-operation-guard';

type Profile = SellerProfileResponse['sellerProfile'];

const profilePhotoOptions = {
  maxDimension: 1600,
  maxBytes: 2 * 1024 * 1024,
  maxSourceBytes: 25 * 1024 * 1024,
  quality: 0.85,
} as const;

type ReportProfileError = (
  error: unknown,
  surface: string,
  fallback?: string,
  operation?: number,
) => void;

/**
 * Owns the profile photo: the remote application photo query, local picker
 * selection, preview state and the pending upload blob.
 */
export function useProfilePhoto({
  api,
  queryClient,
  guard,
  profile,
  hydrationToken,
  fieldsEditable,
  reportError,
  clearAlert,
}: {
  api: ReturnType<typeof useApiClient>;
  queryClient: QueryClient;
  guard: ProfileOperationGuard;
  profile: Profile | undefined;
  hydrationToken: string | undefined;
  fieldsEditable: boolean;
  reportError: ReportProfileError;
  clearAlert: () => void;
}) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const photoSelection = useRef(0);
  const photoBlobRef = useRef<Blob | null>(null);
  const seenAuthEpoch = useRef(guard.authEpoch);

  const applicationPhoto = useQuery({
    queryKey: ['seller', 'application-photo', profile?.id, hydrationToken],
    queryFn: async () => {
      const epoch = currentAuthEpoch(queryClient);
      const photo = await api.portfolio.getAuthorApplicationPhoto();
      if (!canWritePrivateCache(queryClient, epoch)) {
        throw new Error('Private cache is closed');
      }
      return photo;
    },
    enabled: Boolean(profile) && !photoBlob,
    retry: false,
  });

  useEffect(() => {
    if (seenAuthEpoch.current === guard.authEpoch) return;
    seenAuthEpoch.current = guard.authEpoch;
    photoSelection.current += 1;
    photoBlobRef.current = null;
    setPhotoBlob(null);
    setPhotoUri(null);
    setPhotoFailed(false);
  }, [guard.authEpoch]);

  useEffect(() => {
    if (!profile || photoBlob || !applicationPhoto.data) return;
    let cancelled = false;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (!cancelled && typeof reader.result === 'string') {
        setPhotoUri(reader.result);
        setPhotoFailed(false);
      }
    };
    reader.onerror = () => {
      if (!cancelled) setPhotoFailed(true);
    };
    reader.readAsDataURL(applicationPhoto.data);
    return () => {
      cancelled = true;
    };
  }, [applicationPhoto.data, photoBlob, profile]);

  const choosePhoto = async () => {
    if (!fieldsEditable || guard.transitionLock.current) return;
    const epoch = currentAuthEpoch(queryClient);
    const operation = guard.currentOperation();
    const startedInFocus = guard.focusTurn.current;
    const selection = photoSelection.current + 1;
    photoSelection.current = selection;
    const stillOwnsPhoto = () =>
      guard.focusTurn.current === startedInFocus &&
      selection === photoSelection.current &&
      !guard.transitionLock.current &&
      guard.screenStillOwns(operation, epoch);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 1,
      });
      if (!stillOwnsPhoto()) return;
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const prepared = await prepareImageUpload(asset, profilePhotoOptions);
      if (!stillOwnsPhoto()) return;
      photoBlobRef.current = prepared.blob;
      setPhotoUri(prepared.uri);
      setPhotoFailed(false);
      setPhotoBlob(prepared.blob);
      clearAlert();
    } catch (error) {
      if (stillOwnsPhoto()) {
        reportError(
          error,
          'seller-profile-photo',
          'Не удалось выбрать фото',
          operation,
        );
      }
    }
  };

  const preview =
    photoUri ?? (profile ? getApiAssetUrl(profile.profilePhotoUrl) : null);

  return {
    photoBlob,
    photoBlobRef,
    photoFailed,
    setPhotoFailed,
    choosePhoto,
    preview,
    clearIfCurrent: (blob: Blob | null) => {
      if (photoBlobRef.current === blob) {
        photoBlobRef.current = null;
        setPhotoBlob(null);
      }
    },
  };
}

export type ProfilePhoto = ReturnType<typeof useProfilePhoto>;
