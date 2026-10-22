import { useEffect, useRef, useState } from 'react';
import { useMutation, type QueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

import { ImagePreparationError } from '../../lib/media/prepare-image-upload';

import {
  workImageMaxInputBytes,
  type ProductStatus,
} from '@bidplace/contracts';

import type { ApiClient } from '@bidplace/api-client';

import { canWritePrivateCache, currentAuthEpoch } from '../../lib/query-cache';
import { invalidateOwnerWorks } from './owner-work-query';
import type { ProductDraftSaveSession } from './product-draft-save';
import type { ProductStoryEditor } from './use-product-story-editor';

export type UploadImageState = {
  key: string;
  uri: string;
  status: 'queued' | 'preparing' | 'uploading' | 'done' | 'error';
};

type UploadBatch = {
  assets: Array<ImagePicker.ImagePickerAsset | null>;
  next: number;
  blob: Blob | undefined;
  key: string;
  productId: string;
  epoch: number;
  operation: number;
};

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
  const pendingUpload = useRef<UploadBatch | null>(null);
  const pickerLock = useRef(false);
  const uploadController = useRef<AbortController | null>(null);
  const [uploadFiles, setUploadFiles] = useState<UploadImageState[]>([]);
  const [choosingImages, setChoosingImages] = useState(false);
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
    uploadController.current?.abort();
    pickerLock.current = false;
    setChoosingImages(false);
    setUploadFiles([]);
    setImageSelectionError(null);
    upload.reset();
    imageSelection.current += 1;
  }, [authEpoch]);

  useEffect(
    () => () => {
      uploadController.current?.abort();
    },
    [],
  );

  const ownsBatch = (batch: UploadBatch) =>
    pendingUpload.current === batch &&
    session.isCurrentOperation(batch.operation) &&
    !session.transitionLock.current &&
    session.persistedProductId() === batch.productId &&
    canWritePrivateCache(queryClient, batch.epoch);

  const upload = useMutation({
    mutationFn: async (batch: UploadBatch) => {
      const setStatus = (status: UploadImageState['status']) => {
        const currentIndex = batch.next;
        if (ownsBatch(batch))
          setUploadFiles((files) =>
            files.map((file, index) =>
              index === currentIndex ? { ...file, status } : file,
            ),
          );
      };
      while (batch.next < batch.assets.length && ownsBatch(batch)) {
        try {
          const asset = batch.assets[batch.next]!;
          setStatus('preparing');
          if (
            asset.fileSize !== undefined &&
            asset.fileSize > workImageMaxInputBytes
          )
            throw new ImagePreparationError('SOURCE_TOO_LARGE');
          if (!batch.blob) {
            if (asset.file) batch.blob = asset.file;
            else {
              const response = await fetch(asset.uri);
              if (!response.ok) throw new ImagePreparationError('READ_FAILED');
              batch.blob = await response.blob();
            }
          }
          if (!ownsBatch(batch)) return;
          if (batch.blob.size > workImageMaxInputBytes)
            throw new ImagePreparationError('SOURCE_TOO_LARGE');
          if (!batch.blob.size) throw new ImagePreparationError('EMPTY_FILE');
          setStatus('uploading');
          const controller = new AbortController();
          uploadController.current = controller;
          const deadline = setTimeout(() => controller.abort(), 90_000);
          try {
            await api.images.add(
              batch.productId,
              [batch.blob],
              `${batch.key}:${batch.next}`,
              { signal: controller.signal },
            );
          } finally {
            clearTimeout(deadline);
            if (uploadController.current === controller)
              uploadController.current = null;
          }
          if (!ownsBatch(batch)) return;
          setStatus('done');
          batch.assets[batch.next] = null;
          batch.next += 1;
          batch.blob = undefined;
          await invalidateOwnerWorks(queryClient, batch.productId);
        } catch (error) {
          if (!ownsBatch(batch)) return;
          setStatus('error');
          throw error;
        }
      }
      if (ownsBatch(batch)) pendingUpload.current = null;
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
    if (
      session.transitionLock.current ||
      !existingProduct ||
      pickerLock.current ||
      upload.isPending
    )
      return;
    pickerLock.current = true;
    setChoosingImages(true);
    const epoch = currentAuthEpoch(queryClient);
    const operation = session.snapshotOperation();
    const selection = ++imageSelection.current;
    const stillOwnsImages = () =>
      selection === imageSelection.current &&
      !session.transitionLock.current &&
      session.isCurrentOperation(operation) &&
      canWritePrivateCache(queryClient, epoch);
    try {
      if (!(await persistApprovedSnapshot()) || !stillOwnsImages()) return;
      setImageSelectionError(null);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: Math.max(1, 10 - existingProduct.images.length),
        quality: 1,
      });
      if (!stillOwnsImages() || result.canceled || !result.assets.length)
        return;
      const id = session.persistedProductId();
      if (!id) return;
      const key = crypto.randomUUID();
      const batch: UploadBatch = {
        assets: [...result.assets],
        next: 0,
        blob: undefined,
        key,
        productId: id,
        epoch,
        operation,
      };
      pendingUpload.current = batch;
      setUploadFiles(
        result.assets.map((asset, index) => ({
          key: `${key}:${index}`,
          uri: asset.uri,
          status: 'queued',
        })),
      );
      upload.mutate(batch);
    } catch {
      if (stillOwnsImages())
        setImageSelectionError(
          'Не удалось прочитать выбранные изображения. Выберите файлы ещё раз.',
        );
    } finally {
      if (selection === imageSelection.current) {
        pickerLock.current = false;
        setChoosingImages(false);
      }
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
      upload.mutate(pendingUpload.current);
  };

  return {
    upload,
    uploadFiles,
    choosingImages,
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
