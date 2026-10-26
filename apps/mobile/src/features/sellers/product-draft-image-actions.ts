import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, type QueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

import {
  ImagePreparationError,
  readImageUpload,
  type ImageUploadInput,
} from '../../lib/media/prepare-image-upload';

import {
  workImageMaxInputBytes,
  type ProductStatus,
  type Product,
  type WorkPhotoResult,
} from '@bidplace/contracts';

import type { ApiClient } from '@bidplace/api-client';

import {
  authKeys,
  canWritePrivateCache,
  currentAuthEpoch,
} from '../../lib/query-cache';
import { invalidateOwnerWorks } from './owner-work-query';
import {
  originalPhotoEdit,
  preparePhotoEdit,
  localPhotoBlob,
  type PhotoEdit,
} from '../../lib/media/photo-edit';
import {
  workPhotoSessionKey,
  watchWorkPhotoResources,
  type WorkPhotoCard,
  type WorkPhotoSession,
} from './work-photo-session';
import { rememberPendingOpener } from '../../components/ui/use-return-focus';
import { Image as NativeImage } from 'react-native';
import { ApiClientError } from '@bidplace/api-client';
import { shouldClearSessionForError } from '../../errors';
import type { ProductDraftSaveSession } from './product-draft-save';
import type { ProductStoryEditor } from './use-product-story-editor';

export type UploadImageState = {
  key: string;
  uri: string;
  status: 'local' | 'queued' | 'preparing' | 'uploading' | 'done' | 'error';
};

type SelectedWorkImages = {
  images: readonly ImageUploadInput[];
  productId: string;
  epoch: number;
  operation: number;
  selection: number;
};

type UploadBatch = {
  productId: string;
  epoch: number;
  operation: number;
  cards: WorkPhotoCard[];
  revisionId: string | null;
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
  existingProduct?: Pick<Product, 'id' | 'images'>;
  editorStatus?: ProductStatus;
  session: ProductDraftSaveSession;
  storyEditor: ProductStoryEditor;
}) {
  const mounted = useRef(false);
  const seenAuthEpoch = useRef(authEpoch);
  const deleteConfirmLock = useRef(false);
  const imageSelection = useRef(0);
  const pendingUpload = useRef<UploadBatch | null>(null);
  const pickerLock = useRef(false);
  const uploadController = useRef<AbortController | null>(null);
  const userId =
    queryClient.getQueryData<{ id: string } | null>(authKeys.session)?.id ??
    null;
  const cacheKey = workPhotoSessionKey(userId, existingProduct?.id ?? null);
  watchWorkPhotoResources(queryClient);
  const initialSession = (): WorkPhotoSession => ({
    cards:
      existingProduct?.images.map((image) => ({
        id: image.slotId ?? image.id,
        uri: `/api/images/${image.id}`,
        width: image.width,
        height: image.height,
        edit: { ...originalPhotoEdit, crop: image.crop ?? null },
        kind: 'saved',
        operationKey: crypto.randomUUID(),
        status: 'done',
      })) ?? [],
    revisionId: null,
    orderConfirmed: true,
    orderError: null,
    busy: false,
  });
  const photoState = useQuery({
    queryKey: cacheKey,
    queryFn: initialSession,
    initialData: initialSession,
    enabled: false,
    gcTime: Infinity,
  });
  const currentPhotos = () =>
    queryClient.getQueryData<WorkPhotoSession>(cacheKey) ?? initialSession();
  const updatePhotos = (
    update: (value: WorkPhotoSession) => WorkPhotoSession,
  ) => {
    if (canWritePrivateCache(queryClient, authEpoch))
      queryClient.setQueryData<WorkPhotoSession>(cacheKey, (value) =>
        update(value ?? initialSession()),
      );
  };
  const updateCard = (
    id: string,
    update: (card: WorkPhotoCard) => WorkPhotoCard,
  ) =>
    updatePhotos((value) => ({
      ...value,
      cards: value.cards.map((card) => (card.id === id ? update(card) : card)),
    }));
  const editorTurn = useRef(0);
  const editorPreparing = useRef(false);
  const editorSourceDispose = useRef<(() => void) | undefined>(undefined);
  const [editingPhoto, setEditingPhoto] = useState<WorkPhotoCard | null>(null);
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
    editorTurn.current += 1;
    editorSourceDispose.current?.();
    editorSourceDispose.current = undefined;
    setEditingPhoto(null);
    setImageSelectionError(null);
    upload.reset();
    imageSelection.current += 1;
  }, [authEpoch]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      editorSourceDispose.current?.();
      editorSourceDispose.current = undefined;
      imageSelection.current += 1;
      const batch = pendingUpload.current;
      pendingUpload.current = null;
      if (batch && canWritePrivateCache(queryClient, batch.epoch))
        updatePhotos((value) => ({
          ...value,
          busy: false,
          cards: value.cards.map((card) =>
            card.status === 'uploading' || card.status === 'preparing'
              ? { ...card, status: 'error', uncertain: true, retryable: true }
              : card,
          ),
        }));
      uploadController.current?.abort();
    };
  }, [existingProduct?.id, authEpoch]);

  const ownsBatch = (batch: UploadBatch) =>
    mounted.current &&
    pendingUpload.current === batch &&
    session.isCurrentOperation(batch.operation) &&
    !session.transitionLock.current &&
    session.persistedProductId() === batch.productId &&
    canWritePrivateCache(queryClient, batch.epoch);

  const refreshPhotos = async () => {
    const id = session.persistedProductId();
    if (!id) return;
    const epoch = currentAuthEpoch(queryClient);
    const operation = session.snapshotOperation();
    const detail = await api.sellers.getProduct(id);
    if (
      !mounted.current ||
      !canWritePrivateCache(queryClient, epoch) ||
      !session.isCurrentOperation(operation) ||
      session.persistedProductId() !== id
    )
      return;
    const current = currentPhotos();
    const revisionId = detail.editingRevision?.id ?? null;
    if (
      current.cards.some((card) => card.kind !== 'saved') &&
      current.revisionId &&
      current.revisionId !== revisionId
    )
      throw new ApiClientError(
        'Редакция работы изменилась. Локальные изменения фото сохранены.',
        { kind: 'conflict', status: 409 },
      );
    if (
      current.cards.some(
        (card) =>
          card.kind !== 'saved' &&
          card.server &&
          !detail.product.images.some(
            (image) => image.slotId === card.server!.slotId,
          ),
      )
    )
      throw new ApiClientError(
        'Фото изменилось в другой сессии. Локальные изменения сохранены.',
        { kind: 'conflict', status: 409 },
      );
    updatePhotos((value) => {
      const cards = value.cards
        .filter(
          (card) =>
            card.kind !== 'saved' ||
            detail.product.images.some(
              (image) =>
                image.slotId === card.server?.slotId ||
                image.id === card.server?.imageId ||
                image.id === card.id ||
                image.slotId === card.id,
            ),
        )
        .map((card) => {
          const image = detail.product.images.find(
            (image) =>
              image.slotId === card.server?.slotId ||
              image.id === card.server?.imageId ||
              (!card.source &&
                (image.id === card.id || image.slotId === card.id)),
          );
          if (
            card.server &&
            card.kind !== 'saved' &&
            detail.editingRevision?.id === card.server.revisionId
          )
            return card;
          return image?.slotId && detail.editingRevision
            ? {
                ...card,
                ...(card.kind === 'saved'
                  ? {
                      uri: `/api/images/${image.id}`,
                      edit: { ...originalPhotoEdit, crop: image.crop ?? null },
                    }
                  : {}),
                width: image.width,
                height: image.height,
                server: {
                  revisionId: detail.editingRevision.id,
                  slotId: image.slotId,
                  imageId: image.id,
                  version: image.slotVersion ?? 0,
                  crop: image.crop ?? null,
                },
              }
            : card;
        });
      for (const image of detail.product.images) {
        if (
          cards.some((card) => card.uncertain) ||
          !image.slotId ||
          !detail.editingRevision ||
          cards.some((card) => card.server?.slotId === image.slotId)
        )
          continue;
        cards.push({
          id: image.slotId,
          uri: `/api/images/${image.id}`,
          width: image.width,
          height: image.height,
          server: {
            revisionId: detail.editingRevision.id,
            slotId: image.slotId,
            imageId: image.id,
            version: image.slotVersion ?? 0,
            crop: image.crop ?? null,
          },
          edit: { ...originalPhotoEdit, crop: image.crop ?? null },
          operationKey: crypto.randomUUID(),
          status: 'done',
          kind: 'saved',
        });
      }
      return {
        ...value,
        cards,
        revisionId: detail.editingRevision?.id ?? null,
      };
    });
    return detail;
  };

  const upload = useMutation({
    mutationFn: async (batch: UploadBatch) => {
      const active = () => ownsBatch(batch);
      const accepted = (id: string, server: WorkPhotoResult) =>
        updateCard(id, (card) => ({
          ...card,
          server,
          status: 'done',
          kind: 'saved',
          uncertain: false,
          edit: { ...originalPhotoEdit, crop: server.crop },
          uri: `/api/images/${server.imageId}`,
        }));
      try {
        for (const original of batch.cards) {
          if (!active()) return;
          const card = currentPhotos().cards.find(
            (card) => card.id === original.id,
          );
          if (
            !card ||
            card.status === 'done' ||
            (card.status === 'error' && !card.retryable)
          )
            continue;
          try {
            if (card.uncertain) {
              const result = await api.images.photoOperation(
                batch.productId,
                card.server ? card.operationKey : `${card.operationKey}:0`,
                card.server?.slotId,
              );
              if (!active()) return;
              if (result.photo) {
                if (
                  card.kind === 'add' &&
                  card.edit.crop &&
                  result.photo.crop === null
                ) {
                  updateCard(card.id, (value) => ({
                    ...value,
                    server: result.photo!,
                    kind: 'crop',
                    operationKey: `${card.operationKey}:crop`,
                    uncertain: false,
                  }));
                  const cropped = await api.images.editPhoto(
                    batch.productId,
                    result.photo.slotId,
                    {
                      revisionId: result.photo.revisionId,
                      version: result.photo.version,
                      crop: card.edit.crop,
                      operationKey: `${card.operationKey}:crop`,
                    },
                  );
                  if (!active()) return;
                  accepted(card.id, cropped.photo);
                } else accepted(card.id, result.photo);
                card.prepared?.dispose();
                card.sourceDispose?.();
                updateCard(card.id, (value) => ({
                  ...value,
                  source: undefined,
                  prepared: undefined,
                  sourceDispose: undefined,
                }));
                continue;
              }
            }
            updateCard(card.id, (value) => ({
              ...value,
              status: 'preparing',
              error: undefined,
            }));
            let prepared = card.prepared;
            if (card.kind !== 'crop' && !prepared) {
              if (!card.source) throw new ImagePreparationError('READ_FAILED');
              prepared = await preparePhotoEdit(card.source, card.edit, 'work');
              if (!active()) {
                prepared.dispose();
                return;
              }
              updateCard(card.id, (value) => ({ ...value, prepared }));
            }
            const controller = new AbortController();
            uploadController.current = controller;
            updateCard(card.id, (value) => ({ ...value, status: 'uploading' }));
            let timedOut = false;
            const deadline = setTimeout(
              () => {
                timedOut = true;
                controller.abort();
              },
              60_000 +
                Math.ceil((prepared?.blob.size ?? 0) / (64 * 1024)) * 1000,
            );
            try {
              let server: WorkPhotoResult;
              if (card.server) {
                const result = await api.images.editPhoto(
                  batch.productId,
                  card.server.slotId,
                  {
                    revisionId: card.server.revisionId,
                    version: card.server.version,
                    crop: card.edit.crop,
                    operationKey: card.operationKey,
                  },
                  card.kind === 'replace' ? prepared?.blob : undefined,
                  { signal: controller.signal },
                );
                server = result.photo;
              } else {
                if (!prepared) throw new ImagePreparationError('READ_FAILED');
                const result = await api.images.add(
                  batch.productId,
                  [prepared.blob],
                  card.operationKey,
                  { signal: controller.signal },
                  batch.revisionId ?? undefined,
                );
                if (!('photos' in result) || !result.photos[0])
                  throw new Error('Accepted upload is missing its photo slot');
                server = result.photos[0];
                if (card.edit.crop) {
                  updateCard(card.id, (value) => ({
                    ...value,
                    server,
                    kind: 'crop',
                    operationKey: `${card!.operationKey}:crop`,
                  }));
                  const cropped = await api.images.editPhoto(
                    batch.productId,
                    server.slotId,
                    {
                      revisionId: server.revisionId,
                      version: server.version,
                      crop: card.edit.crop,
                      operationKey: `${card.operationKey}:crop`,
                    },
                    undefined,
                    { signal: controller.signal },
                  );
                  server = cropped.photo;
                }
              }
              if (!active()) return;
              accepted(card.id, server);
              prepared?.dispose();
              card.sourceDispose?.();
              updateCard(card.id, (value) => ({
                ...value,
                prepared: undefined,
                source: undefined,
                sourceDispose: undefined,
              }));
            } catch (error) {
              if (timedOut) throw new ImagePreparationError('UPLOAD_TIMEOUT');
              throw error;
            } finally {
              clearTimeout(deadline);
              if (uploadController.current === controller)
                uploadController.current = null;
            }
          } catch (error) {
            if (shouldClearSessionForError(error)) throw error;
            if (!active()) return;
            const retryable =
              !(
                error instanceof ImagePreparationError &&
                [
                  'EMPTY_FILE',
                  'SOURCE_TOO_LARGE',
                  'INVALID_DIMENSIONS',
                  'PROCESSING_FAILED',
                ].includes(error.code)
              ) &&
              !(
                error instanceof ApiClientError &&
                [400, 401, 403, 409, 413, 415].includes(error.status)
              );
            updateCard(card.id, (value) => ({
              ...value,
              status: 'error',
              error,
              retryable,
              uncertain: retryable,
            }));
          }
        }
        if (!active()) return;
        const cards = currentPhotos().cards;
        if (cards.some((card) => card.status !== 'done' || !card.server))
          return;
        const imageIds = cards.map((card) => card.server!.imageId);
        if (imageIds.length)
          await api.images.reorder(
            batch.productId,
            imageIds,
            cards[0]!.server!.revisionId,
          );
        if (!active()) return;
        const detail = await api.sellers.getProduct(batch.productId);
        if (!active()) return;
        if (
          JSON.stringify(detail.product.images.map((image) => image.id)) !==
          JSON.stringify(imageIds)
        )
          throw new Error('Image order was not confirmed');
        updatePhotos((value) => ({
          ...value,
          orderConfirmed: true,
          orderError: null,
        }));
        await invalidateOwnerWorks(queryClient, batch.productId);
      } catch (error) {
        if (shouldClearSessionForError(error)) throw error;
        if (active())
          updatePhotos((value) => ({ ...value, orderError: error }));
      } finally {
        if (active()) {
          pendingUpload.current = null;
          updatePhotos((value) => ({ ...value, busy: false }));
        }
      }
    },
  });
  useEffect(() => {
    if (!existingProduct) return;
    let active = true;
    const epoch = currentAuthEpoch(queryClient);
    void (async () => {
      for (const card of currentPhotos().cards.filter(
        (card) => card.uncertain,
      )) {
        const result = await api.images.photoOperation(
          existingProduct.id,
          card.server ? card.operationKey : `${card.operationKey}:0`,
          card.server?.slotId,
        );
        if (!active || !canWritePrivateCache(queryClient, epoch)) return;
        if (result.photo) {
          const server = result.photo;
          const pendingCrop =
            card.kind === 'add' && card.edit.crop && server.crop === null;
          updateCard(card.id, (value) =>
            pendingCrop
              ? {
                  ...value,
                  server,
                  kind: 'crop',
                  status: 'local',
                  uncertain: false,
                  operationKey: `${card.operationKey}:crop`,
                }
              : {
                  ...value,
                  server,
                  kind: 'saved',
                  status: 'done',
                  uncertain: false,
                  uri: `/api/images/${server.imageId}`,
                  edit: { ...originalPhotoEdit, crop: server.crop },
                },
          );
          if (!pendingCrop) {
            card.prepared?.dispose();
            card.sourceDispose?.();
            updateCard(card.id, (value) => ({
              ...value,
              source: undefined,
              prepared: undefined,
              sourceDispose: undefined,
            }));
          }
        }
      }
      if (active) await refreshPhotos();
    })().catch((error: unknown) => {
      if (active && canWritePrivateCache(queryClient, epoch))
        updatePhotos((value) => ({ ...value, orderError: error }));
    });
    return () => {
      active = false;
    };
  }, [existingProduct?.id, authEpoch]);

  const removeImage = useMutation({
    mutationFn: async ({
      imageId,
      revisionId,
    }: {
      imageId: string;
      revisionId?: string;
    }) => {
      const epoch = currentAuthEpoch(queryClient);
      const id = session.persistedProductId();
      if (!id) throw new Error('Product is not saved');
      if (revisionId) await api.images.remove(id, imageId, revisionId);
      else await api.images.remove(id, imageId);
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

  const selectImages = async (): Promise<SelectedWorkImages | undefined> => {
    if (
      !mounted.current ||
      session.transitionLock.current ||
      !existingProduct ||
      pickerLock.current ||
      currentPhotos().busy ||
      upload.isPending
    )
      return;
    const id = session.persistedProductId();
    if (!id) return;
    pickerLock.current = true;
    setChoosingImages(true);
    const epoch = currentAuthEpoch(queryClient);
    const operation = session.snapshotOperation();
    const selection = ++imageSelection.current;
    const stillOwnsImages = () =>
      mounted.current &&
      selection === imageSelection.current &&
      !session.transitionLock.current &&
      session.isCurrentOperation(operation) &&
      session.persistedProductId() === id &&
      canWritePrivateCache(queryClient, epoch);
    try {
      if (!(await persistApprovedSnapshot()) || !stillOwnsImages()) return;
      await refreshPhotos();
      if (!stillOwnsImages()) return;
      setImageSelectionError(null);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: Math.max(1, 10 - currentPhotos().cards.length),
        quality: 1,
      });
      if (!stillOwnsImages() || result.canceled || !result.assets.length)
        return;
      return {
        images: [...result.assets],
        productId: id,
        epoch,
        operation,
        selection,
      };
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

  const sameSource = async (source: Uint8Array, previous: ImageUploadInput) => {
    const candidate = await readImageUpload(previous, workImageMaxInputBytes);
    if (source.byteLength !== candidate.size) return false;
    const second = new Uint8Array(await candidate.arrayBuffer());
    return source.every((value, index) => value === second[index]);
  };

  const addSelection = async (selected: SelectedWorkImages) => {
    if (
      selected.selection !== imageSelection.current ||
      !mounted.current ||
      !session.isCurrentOperation(selected.operation) ||
      session.persistedProductId() !== selected.productId ||
      !canWritePrivateCache(queryClient, selected.epoch) ||
      currentPhotos().busy ||
      pickerLock.current
    )
      return false;
    const inputs = selected.images.map((input) => ({ ...input }));
    const generation = ++imageSelection.current;
    pickerLock.current = true;
    setChoosingImages(true);
    try {
      for (const source of inputs) {
        if (currentPhotos().cards.length >= 10) break;
        let duplicate = false;
        let selectionError: unknown;
        try {
          const bytes = new Uint8Array(
            await (
              await readImageUpload(source, workImageMaxInputBytes)
            ).arrayBuffer(),
          );
          for (const card of currentPhotos().cards) {
            if (!card.selectedSource) continue;
            try {
              if (await sameSource(bytes, card.selectedSource)) {
                duplicate = true;
                break;
              }
            } catch {
              // An unavailable earlier source cannot establish a duplicate.
              updateCard(card.id, (value) => ({
                ...value,
                selectedSource: undefined,
              }));
            }
          }
        } catch (error) {
          selectionError = error;
        }
        if (
          !mounted.current ||
          generation !== imageSelection.current ||
          !session.isCurrentOperation(selected.operation) ||
          !canWritePrivateCache(queryClient, selected.epoch)
        )
          return false;
        if (duplicate) {
          setImageSelectionError('Это фото уже выбрано.');
          continue;
        }
        const id = crypto.randomUUID();
        updatePhotos((value) => ({
          ...value,
          orderConfirmed: false,
          cards: [
            ...value.cards,
            {
              id,
              uri: source.uri,
              width: source.width,
              height: source.height,
              source,
              selectedSource: selectionError ? undefined : source,
              edit: { ...originalPhotoEdit },
              kind: 'add',
              operationKey: crypto.randomUUID(),
              status: selectionError ? 'error' : 'local',
              ...(selectionError
                ? { error: selectionError, retryable: false }
                : {}),
            },
          ],
        }));
      }
      return true;
    } catch (error) {
      if (mounted.current && canWritePrivateCache(queryClient, selected.epoch))
        setImageSelectionError(
          error instanceof ImagePreparationError &&
            error.code === 'SOURCE_TOO_LARGE'
            ? 'Исходный файл слишком большой. Выберите другое фото.'
            : 'Не удалось прочитать выбранные изображения. Выберите файлы ещё раз.',
        );
      return false;
    } finally {
      if (
        mounted.current &&
        canWritePrivateCache(queryClient, selected.epoch)
      ) {
        pickerLock.current = false;
        setChoosingImages(false);
      }
    }
  };

  const startUpload = async (
    selected?: SelectedWorkImages,
    onlyId?: string,
  ) => {
    if (
      selected &&
      !(await addSelection({
        ...selected,
        images: selected.images.map((input) => ({ ...input })),
      }))
    )
      return;
    const id = session.persistedProductId();
    if (
      !id ||
      !mounted.current ||
      session.transitionLock.current ||
      pickerLock.current ||
      currentPhotos().busy ||
      upload.isPending
    )
      return;
    pickerLock.current = true;
    const epoch = currentAuthEpoch(queryClient),
      operation = session.snapshotOperation();
    try {
      if (!(await session.persistDirtyForm())) return;
      if (
        !mounted.current ||
        !session.isCurrentOperation(operation) ||
        !canWritePrivateCache(queryClient, epoch)
      )
        return;
      await refreshPhotos();
      if (
        !mounted.current ||
        !session.isCurrentOperation(operation) ||
        !canWritePrivateCache(queryClient, epoch)
      )
        return;
      const cards = currentPhotos().cards.filter(
        (card) => !onlyId || card.id === onlyId || card.status === 'done',
      );
      const batch = {
        productId: id,
        epoch,
        operation,
        cards,
        revisionId: currentPhotos().revisionId,
      };
      pendingUpload.current = batch;
      updatePhotos((value) => ({ ...value, busy: true, orderError: null }));
      upload.mutate(batch);
    } catch (error) {
      if (mounted.current && canWritePrivateCache(queryClient, epoch))
        updatePhotos((value) => ({ ...value, orderError: error }));
    } finally {
      pickerLock.current = false;
    }
  };

  const chooseImages = async () => {
    const selected = await selectImages();
    if (selected) await addSelection(selected);
  };

  const editPhoto = async (id: string) => {
    if (currentPhotos().busy || pickerLock.current) return;
    const epoch = currentAuthEpoch(queryClient),
      operation = session.snapshotOperation();
    const productId = session.persistedProductId();
    const turn = ++editorTurn.current;
    setImageSelectionError(null);
    const active = () =>
      mounted.current &&
      editorTurn.current === turn &&
      session.isCurrentOperation(operation) &&
      session.persistedProductId() === productId &&
      canWritePrivateCache(queryClient, epoch);
    pickerLock.current = true;
    setChoosingImages(true);
    let local: Awaited<ReturnType<typeof localPhotoBlob>> | undefined;
    try {
      if (!(await persistApprovedSnapshot()) || !active()) return;
      await refreshPhotos();
      if (!active()) return;
      const card = currentPhotos().cards.find((card) => card.id === id);
      if (!card) return;
      if (card.server && card.kind === 'saved') {
        const blob = await api.images.getImageSource(card.server.imageId);
        if (!active()) return;
        local = await localPhotoBlob(blob);
        const dimensions = await new Promise<{ width: number; height: number }>(
          (resolve, reject) =>
            NativeImage.getSize(
              local!.uri,
              (width, height) => resolve({ width, height }),
              reject,
            ),
        );
        if (!active()) return;
        editorSourceDispose.current = local.dispose;
        setEditingPhoto({
          ...card,
          source: { uri: local.uri, mimeType: blob.type, ...dimensions },
          edit: { ...originalPhotoEdit, crop: card.server.crop },
        });
        local = undefined;
      } else setEditingPhoto(card);
      rememberPendingOpener(
        `[aria-label="Редактировать фото ${currentPhotos().cards.findIndex((photo) => photo.id === id) + 1}"]`,
      );
    } catch {
      if (active())
        setImageSelectionError('Не удалось открыть фото. Повторите попытку.');
    } finally {
      local?.dispose();
      if (
        mounted.current &&
        editorTurn.current === turn &&
        canWritePrivateCache(queryClient, epoch)
      ) {
        pickerLock.current = false;
        setChoosingImages(false);
      }
    }
  };

  const confirmPhotoEdit = async (edit: PhotoEdit) => {
    const card = editingPhoto;
    if (!card?.source || currentPhotos().busy || editorPreparing.current)
      return;
    const epoch = currentAuthEpoch(queryClient),
      operation = session.snapshotOperation();
    const turn = editorTurn.current;
    const sourceDispose = editorSourceDispose.current;
    editorPreparing.current = true;
    setImageSelectionError(null);
    setChoosingImages(true);
    try {
      const unchangedOrientation =
        edit.rotate === card.edit.rotate &&
        edit.flipHorizontal === card.edit.flipHorizontal &&
        edit.flipVertical === card.edit.flipVertical;
      const prepared =
        unchangedOrientation && card.prepared
          ? card.prepared
          : await preparePhotoEdit(card.source, edit, 'work');
      if (
        turn !== editorTurn.current ||
        !mounted.current ||
        !session.isCurrentOperation(operation) ||
        !canWritePrivateCache(queryClient, epoch)
      ) {
        prepared.dispose();
        return;
      }
      updateCard(card.id, (value) => {
        if (value.prepared !== prepared) value.prepared?.dispose();
        return {
          ...value,
          source: card.source,
          sourceDispose: editorSourceDispose.current ?? value.sourceDispose,
          edit,
          prepared,
          uri: prepared.input.uri,
          width: prepared.input.width,
          height: prepared.input.height,
          kind: card.server
            ? edit.rotate || edit.flipHorizontal || edit.flipVertical
              ? 'replace'
              : 'crop'
            : 'add',
          operationKey: crypto.randomUUID(),
          status: 'local',
          uncertain: false,
        };
      });
      updatePhotos((value) => ({ ...value, orderConfirmed: false }));
      editorSourceDispose.current = undefined;
      setEditingPhoto(null);
    } catch {
      if (
        turn === editorTurn.current &&
        mounted.current &&
        canWritePrivateCache(queryClient, epoch)
      )
        setImageSelectionError('Не удалось обработать выбранное фото.');
    } finally {
      editorPreparing.current = false;
      if (turn !== editorTurn.current) sourceDispose?.();
      if (mounted.current && canWritePrivateCache(queryClient, epoch))
        setChoosingImages(false);
    }
  };

  const closePhotoEdit = () => {
    editorTurn.current += 1;
    setImageSelectionError(null);
    if (!editorPreparing.current) editorSourceDispose.current?.();
    editorSourceDispose.current = undefined;
    setEditingPhoto(null);
  };

  const movePhotoTo = (id: string, target: number) => {
    if (currentPhotos().busy || pickerLock.current || editorPreparing.current)
      return;
    updatePhotos((value) => {
      const cards = [...value.cards],
        index = cards.findIndex((card) => card.id === id);
      if (index < 0 || target < 0 || target >= cards.length || index === target)
        return value;
      const [card] = cards.splice(index, 1);
      cards.splice(target, 0, card!);
      return { ...value, cards, orderConfirmed: false };
    });
  };

  const removePhoto = async (id: string) => {
    if (currentPhotos().busy || pickerLock.current || editorPreparing.current)
      return;
    const epoch = currentAuthEpoch(queryClient),
      operation = session.snapshotOperation();
    updatePhotos((value) => ({ ...value, busy: true }));
    try {
      if (!(await persistApprovedSnapshot())) return;
      await refreshPhotos();
      if (
        !mounted.current ||
        !session.isCurrentOperation(operation) ||
        !canWritePrivateCache(queryClient, epoch)
      )
        return;
      let card = currentPhotos().cards.find((card) => card.id === id);
      if (!card) return;
      if (card.uncertain) {
        const result = await api.images.photoOperation(
          session.persistedProductId()!,
          card.server ? card.operationKey : `${card.operationKey}:0`,
          card.server?.slotId,
        );
        if (
          !mounted.current ||
          !session.isCurrentOperation(operation) ||
          !canWritePrivateCache(queryClient, epoch)
        )
          return;
        if (!result.photo) {
          setImageSelectionError(
            'Ответ загрузки ещё не подтверждён. Повторите загрузку этой карточки перед удалением.',
          );
          return;
        }
        card = { ...card, server: result.photo };
      }
      if (card.server)
        await removeImage.mutateAsync({
          imageId: card.server.imageId,
          revisionId: card.server.revisionId,
        });
      if (
        !mounted.current ||
        !session.isCurrentOperation(operation) ||
        !canWritePrivateCache(queryClient, epoch)
      )
        return;
      card.prepared?.dispose();
      card.sourceDispose?.();
      updatePhotos((value) => ({
        ...value,
        cards: value.cards.filter((card) => card.id !== id),
        orderConfirmed: false,
      }));
    } catch (error) {
      if (mounted.current && canWritePrivateCache(queryClient, epoch))
        updatePhotos((value) => ({ ...value, orderError: error }));
    } finally {
      if (mounted.current && canWritePrivateCache(queryClient, epoch))
        updatePhotos((value) => ({ ...value, busy: false }));
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
        await removeImage.mutateAsync({ imageId });
        setImagePendingDelete(null);
      } catch {
        // The dialog stays open so the same confirm can be repeated.
      } finally {
        deleteConfirmLock.current = false;
        setDeleteConfirmLocked(false);
      }
    })();
  };

  const cancelUpload = async () => {
    if (currentPhotos().busy || pickerLock.current) return;
    const epoch = currentAuthEpoch(queryClient);
    try {
      for (const card of currentPhotos().cards.filter(
        (card) => card.uncertain,
      )) {
        const result = await api.images.photoOperation(
          existingProduct!.id,
          card.server ? card.operationKey : `${card.operationKey}:0`,
          card.server?.slotId,
        );
        if (!mounted.current || !canWritePrivateCache(queryClient, epoch))
          return;
        if (!result.photo) {
          setImageSelectionError(
            'Ответ загрузки ещё не подтверждён. Повторите загрузку этой карточки перед отбрасыванием.',
          );
          return;
        }
        if (result.photo)
          updateCard(card.id, (value) => ({
            ...value,
            server: result.photo!,
            status: 'done',
            kind: 'saved',
            uncertain: false,
          }));
      }
      updatePhotos((value) => ({
        ...value,
        cards: value.cards
          .filter((card) => {
            card.prepared?.dispose();
            card.sourceDispose?.();
            return Boolean(card.server);
          })
          .map((card) => ({
            ...card,
            kind: 'saved',
            status: 'done',
            source: undefined,
            prepared: undefined,
            sourceDispose: undefined,
            edit: { ...originalPhotoEdit, crop: card.server!.crop },
            uri: `/api/images/${card.server!.imageId}`,
          })),
        orderConfirmed: false,
      }));
      const detail = await refreshPhotos();
      if (!detail) return;
      updatePhotos((value) => ({
        ...value,
        cards: [...value.cards].sort(
          (a, b) =>
            (detail.product.images.findIndex(
              (image) => image.id === a.server?.imageId,
            ) ?? 0) -
            (detail.product.images.findIndex(
              (image) => image.id === b.server?.imageId,
            ) ?? 0),
        ),
        orderError: null,
      }));
      upload.reset();
    } catch (error) {
      if (mounted.current && canWritePrivateCache(queryClient, epoch))
        updatePhotos((value) => ({ ...value, orderError: error }));
    }
  };
  const retryUpload = (id?: string) => {
    void startUpload(undefined, id);
  };

  return {
    upload,
    uploadFiles: photoState.data.cards.map((card) => ({
      key: card.id,
      uri: card.uri,
      status: card.status,
    })),
    photoCards: photoState.data.cards,
    photosBusy: photoState.data.busy,
    photoOrderConfirmed: photoState.data.orderConfirmed,
    photoOrderError: photoState.data.orderError,
    editingPhoto,
    editPhoto,
    confirmPhotoEdit,
    closePhotoEdit,
    movePhotoTo,
    removePhoto,
    choosingImages,
    removeImage,
    reorderImages,
    imageSelectionError,
    imagePendingDelete,
    setImagePendingDelete,
    deleteConfirmLocked,
    selectImages,
    startUpload,
    chooseImages,
    chooseStoryImage,
    reorder,
    confirmImageDelete,
    retryUpload,
    cancelUpload,
  };
}
