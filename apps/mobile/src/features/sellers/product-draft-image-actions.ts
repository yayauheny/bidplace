import { useEffect, useRef, useState } from 'react';
import { useMutation, type QueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

import type { ProductStatus } from '@bidplace/contracts';

import type { ApiClient } from '@bidplace/api-client';

import { canWritePrivateCache, currentAuthEpoch } from '../../lib/query-cache';
import { invalidateOwnerWorks } from './owner-work-query';
import type { ProductDraftSaveSession } from './product-draft-save';
import type { ProductStoryEditor } from './use-product-story-editor';

/**
 * Image mutations and pickers for the product draft screen: upload, remove,
 * reorder, and the picker flows. Approved-editor mutations first wait for an
 * in-flight or pending form save, because they touch the published revision.
 */
export function useProductDraftImageActions({
  api,
  queryClient,
  authEpoch,
  existingProduct,
  editorStatus,
  session,
  storyEditor,
}: {
  api: ApiClient;
  queryClient: QueryClient;
  authEpoch: number;
  existingProduct?: { id: string; images: Array<{ id: string }> };
  editorStatus?: ProductStatus;
  session: ProductDraftSaveSession;
  storyEditor: ProductStoryEditor;
}) {
  const seenAuthEpoch = useRef(authEpoch);
  const deleteConfirmLock = useRef(false);
  const imageSelection = useRef(0);
  const pendingUpload = useRef<{ images: Blob[]; key: string } | null>(null);
  const [deleteConfirmLocked, setDeleteConfirmLocked] = useState(false);
  const [imagePendingDelete, setImagePendingDelete] = useState<string | null>(
    null,
  );
  const [imageSelectionError, setImageSelectionError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (seenAuthEpoch.current === authEpoch) return;
    seenAuthEpoch.current = authEpoch;
    pendingUpload.current = null;
    imageSelection.current += 1;
  }, [authEpoch]);

  const upload = useMutation({
    mutationFn: async (images: Blob[]) => {
      const epoch = currentAuthEpoch(queryClient);
      const id = session.persistedProductId();
      if (!id) throw new Error('Product is not saved');
      const key = pendingUpload.current?.key;
      await api.images.add(id, images, key);
      return epoch;
    },
    onSuccess: (epoch) => {
      if (!canWritePrivateCache(queryClient, epoch)) return;
      pendingUpload.current = null;
      const id = session.persistedProductId();
      if (!id) return;
      return invalidateOwnerWorks(queryClient, id);
    },
  });
  const removeImage = useMutation({
    mutationFn: async (imageId: string) => {
      const epoch = currentAuthEpoch(queryClient);
      const id = session.persistedProductId();
      if (!id) throw new Error('Product is not saved');
      await api.images.remove(id, imageId);
      return epoch;
    },
    onSuccess: (epoch) => {
      if (!canWritePrivateCache(queryClient, epoch)) return;
      const id = session.persistedProductId();
      if (!id) return;
      return invalidateOwnerWorks(queryClient, id);
    },
  });
  const reorderImages = useMutation({
    mutationFn: async (imageIds: string[]) => {
      const epoch = currentAuthEpoch(queryClient);
      const id = session.persistedProductId();
      if (!id) throw new Error('Product is not saved');
      await api.images.reorder(id, imageIds);
      return epoch;
    },
    onSuccess: (epoch) => {
      if (!canWritePrivateCache(queryClient, epoch)) return;
      const id = session.persistedProductId();
      if (!id) return;
      return invalidateOwnerWorks(queryClient, id);
    },
  });

  // Approved editors mutate the published revision: an in-flight or pending
  // form save must land first, otherwise the mutation is skipped.
  const persistApprovedSnapshot = async () => {
    if (editorStatus !== 'APPROVED') return true;
    const inFlight = session.inFlightSave();
    const persisted = inFlight
      ? await inFlight
      : await session.persistCurrentForm();
    return persisted;
  };

  const chooseImages = async () => {
    if (session.transitionLock.current || !existingProduct) return;
    const epoch = currentAuthEpoch(queryClient);
    const operation = session.snapshotOperation();
    const selection = imageSelection.current + 1;
    imageSelection.current = selection;
    const stillOwnsImages = () =>
      selection === imageSelection.current &&
      !session.transitionLock.current &&
      session.isCurrentOperation(operation) &&
      canWritePrivateCache(queryClient, epoch);
    if (!(await persistApprovedSnapshot())) return;
    if (!stillOwnsImages()) return;
    setImageSelectionError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 1,
      });
      if (!stillOwnsImages()) return;
      if (result.canceled) return;
      const images = await Promise.all(
        result.assets.map(async (asset) => {
          const response = await fetch(asset.uri);
          if (!response.ok) throw new Error('Selected image could not be read');
          return response.blob();
        }),
      );
      if (!stillOwnsImages()) return;
      pendingUpload.current = { images, key: crypto.randomUUID() };
      upload.mutate(images);
    } catch {
      if (!stillOwnsImages()) return;
      setImageSelectionError(
        'Не удалось прочитать выбранные изображения. Выберите файлы ещё раз.',
      );
    }
  };

  const chooseStoryImage = async () => {
    if (
      session.transitionLock.current ||
      storyEditor.pending ||
      !existingProduct
    )
      return;
    const operation = session.snapshotOperation();
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
      });
      if (result.canceled || !result.assets[0]) return;
      const response = await fetch(result.assets[0].uri);
      if (!response.ok) throw new Error('Selected image could not be read');
      const blob = await response.blob();
      if (!session.isCurrentOperation(operation)) return;
      await storyEditor.addImage(blob);
    } catch {
      if (session.isCurrentOperation(operation)) {
        storyEditor.reportError(
          'Не удалось прочитать выбранное фото. Выберите файл ещё раз.',
        );
      }
    }
  };

  const reorder = async (imageId: string, direction: -1 | 1) => {
    if (!existingProduct) return;
    const operation = session.snapshotOperation();
    const epoch = currentAuthEpoch(queryClient);
    if (!(await persistApprovedSnapshot())) return;
    if (
      !session.isCurrentOperation(operation) ||
      !canWritePrivateCache(queryClient, epoch)
    )
      return;
    const ids = existingProduct.images.map((image) => image.id);
    const index = ids.indexOf(imageId);
    [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
    reorderImages.mutate(ids);
  };

  const confirmImageDelete = async () => {
    if (!imagePendingDelete || deleteConfirmLock.current) return;
    const imageId = imagePendingDelete;
    deleteConfirmLock.current = true;
    setDeleteConfirmLocked(true);
    void (async () => {
      try {
        const operation = session.snapshotOperation();
        const epoch = currentAuthEpoch(queryClient);
        if (!(await persistApprovedSnapshot())) return;
        if (
          !session.isCurrentOperation(operation) ||
          !canWritePrivateCache(queryClient, epoch)
        ) {
          return;
        }
        await removeImage.mutateAsync(imageId);
        setImagePendingDelete(null);
      } catch {
        // The dialog stays open so the same confirm can be repeated.
      } finally {
        deleteConfirmLock.current = false;
        setDeleteConfirmLocked(false);
      }
    })();
  };

  const retryUpload = () => {
    if (
      pendingUpload.current &&
      !upload.isPending &&
      !session.transitionLock.current
    )
      upload.mutate(pendingUpload.current.images);
  };

  return {
    upload,
    removeImage,
    reorderImages,
    imageSelectionError,
    imagePendingDelete,
    setImagePendingDelete,
    deleteConfirmLocked,
    chooseImages,
    chooseStoryImage,
    reorder,
    confirmImageDelete,
    retryUpload,
  };
}
