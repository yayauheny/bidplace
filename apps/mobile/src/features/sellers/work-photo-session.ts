import type { QueryClient } from '@tanstack/react-query';
import type { WorkPhotoResult } from '@bidplace/contracts';
import type { ImageUploadInput } from '../../lib/media/prepare-image-upload';
import type { PhotoEdit } from '../../lib/media/photo-edit';

export type WorkPhotoCard = {
  id: string;
  uri: string;
  width?: number | null;
  height?: number | null;
  source?: ImageUploadInput;
  sourceDispose?: () => void;
  sourceChecksum?: string;
  preview?: {
    uri: string;
    width?: number | null;
    height?: number | null;
    crop: PhotoEdit['crop'];
    failed?: boolean;
  };
  edit: PhotoEdit;
  server?: WorkPhotoResult;
  prepared?: { input: ImageUploadInput; blob: Blob; dispose: () => void };
  kind: 'add' | 'replace' | 'crop' | 'saved';
  operationKey: string;
  status: 'local' | 'queued' | 'preparing' | 'uploading' | 'done' | 'error';
  error?: unknown;
  retryable?: boolean;
  uncertain?: boolean;
};
export type WorkPhotoSession = {
  cards: WorkPhotoCard[];
  revisionId: string | null;
  orderConfirmed: boolean;
  orderError: unknown;
  preparationError?: unknown;
  busy: boolean;
};

export const workPhotoSessionKey = (
  userId: string | null,
  productId: string | null,
) => ['seller', 'photo-session', userId, productId] as const;

const watchedClients = new WeakSet<QueryClient>();
export function watchWorkPhotoResources(queryClient: QueryClient) {
  if (watchedClients.has(queryClient)) return;
  watchedClients.add(queryClient);
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type !== 'removed' || event.query.queryKey[1] !== 'photo-session')
      return;
    const session = event.query.state.data as WorkPhotoSession | undefined;
    for (const card of session?.cards ?? []) {
      card.prepared?.dispose();
      card.sourceDispose?.();
    }
  });
}
