import { useEffect, useRef, useState } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

import {
  localPhotoBlob,
  preparePhotoEdit,
  type PhotoEdit,
} from '../../lib/media/photo-edit';
import { deleteGeneratedImage } from '../../lib/media/temporary-image';
import type { ImageUploadInput } from '../../lib/media/prepare-image-upload';
import { prepareImageUpload } from '../../lib/media/prepare-image-upload';

import type { SellerProfileResponse } from '@bidplace/contracts';

import { rememberPendingOpener } from '../../components/ui/use-return-focus';
import { getApiAssetUrl } from '../../lib/environment';
import {
  canWritePrivateCache,
  currentAuthEpoch,
  sellerKeys,
} from '../../lib/query-cache';
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
  const [preparing, setPreparing] = useState(false);
  const preparingRef = useRef(false);
  const photoBlobRef = useRef<Blob | null>(null);
  const seenAuthEpoch = useRef(guard.authEpoch);
  const photoResource = useRef<(() => void) | undefined>(undefined);
  const [editor, setEditor] = useState<{
    input: ImageUploadInput;
    epoch: number;
    operation: number;
    focusTurn: number;
    selection: number;
  } | null>(null);
  useEffect(() => () => photoResource.current?.(), []);

  const applicationPhoto = useQuery({
    queryKey: sellerKeys.applicationPhoto(profile?.id, hydrationToken),
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
    photoResource.current?.();
    photoResource.current = undefined;
    setEditor(null);
    photoBlobRef.current = null;
    setPhotoBlob(null);
    setPhotoUri(null);
    setPhotoFailed(false);
    preparingRef.current = false;
    setPreparing(false);
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
    if (!fieldsEditable || guard.transitionLock.current || preparingRef.current)
      return;
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
      clearAlert();
      rememberPendingOpener(
        '[aria-label="Изменить фото"], [aria-label="Загрузить фото"]',
      );
      setEditor({
        input: result.assets[0],
        epoch,
        operation,
        focusTurn: startedInFocus,
        selection,
      });
    } catch (error) {
      if (stillOwnsPhoto()) {
        reportError(
          error,
          'seller-profile-photo',
          'Не удалось выбрать фото',
          operation,
        );
      }
    } finally {
      if (
        selection === photoSelection.current &&
        guard.sessionStillOwns(operation, epoch)
      ) {
        preparingRef.current = false;
        setPreparing(false);
      }
    }
  };

  const cancelEditor = () => {
    photoSelection.current += 1;
    clearAlert();
    setEditor(null);
    preparingRef.current = false;
    setPreparing(false);
  };
  const confirmEditor = async (edit: PhotoEdit) => {
    const opened = editor;
    if (!opened || preparingRef.current) return;
    const stillOwns = () =>
      photoSelection.current === opened.selection &&
      guard.focusTurn.current === opened.focusTurn &&
      !guard.transitionLock.current &&
      guard.screenStillOwns(opened.operation, opened.epoch);
    preparingRef.current = true;
    clearAlert();
    setPreparing(true);
    try {
      const transformed = await preparePhotoEdit(opened.input, edit, 'avatar');
      try {
        const prepared = await prepareImageUpload(
          transformed.input,
          profilePhotoOptions,
        );
        const local = await localPhotoBlob(prepared.blob);
        if (
          prepared.uri !== transformed.input.uri &&
          prepared.uri !== opened.input.uri
        )
          await deleteGeneratedImage(prepared.uri);
        if (!stillOwns()) {
          local.dispose();
          return;
        }
        photoResource.current?.();
        photoResource.current = local.dispose;
        photoBlobRef.current = prepared.blob;
        setPhotoUri(local.uri);
        setPhotoFailed(false);
        setPhotoBlob(prepared.blob);
        setEditor(null);
        clearAlert();
      } finally {
        transformed.dispose();
      }
    } catch (error) {
      if (stillOwns())
        reportError(
          error,
          'seller-profile-photo',
          'Не удалось подготовить фото',
          opened.operation,
        );
    } finally {
      if (
        photoSelection.current === opened.selection &&
        guard.sessionStillOwns(opened.operation, opened.epoch)
      ) {
        preparingRef.current = false;
        setPreparing(false);
      }
    }
  };

  const preview =
    photoUri ?? (profile ? getApiAssetUrl(profile.profilePhotoUrl) : null);

  return {
    photoBlob,
    preparing,
    photoBlobRef,
    photoFailed,
    setPhotoFailed,
    choosePhoto,
    editor,
    confirmEditor,
    cancelEditor,
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
