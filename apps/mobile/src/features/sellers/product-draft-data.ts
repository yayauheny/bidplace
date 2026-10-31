import { useEffect, useRef, useState } from 'react';
import { useQuery, type QueryClient } from '@tanstack/react-query';

import type { Product, SellerProductDetailResponse } from '@bidplace/contracts';

import type { ApiClient } from '@bidplace/api-client';

import {
  canWritePrivateCache,
  catalogKeys,
  categoryKeys,
  currentAuthEpoch,
} from '../../lib/query-cache';
import { invalidateOwnerWorks, ownerWorkQueryKeys } from './owner-work-query';
import {
  productToDraftFormValues,
  shouldHydrateProductDraft,
} from './product-draft-form';
import type { ProductDraftFormValues } from './product-draft-form';
import {
  isNewerModerationDecision,
  nextPostSubmitHold,
  shouldKeepCachedProductRevision,
  type ProductRevisionIdentity,
  type TrustedProductRevision,
} from './product-draft-state';

/**
 * Data ownership for the product draft screen: catalog queries, the owner
 * detail query (with trusted-revision tracking), form hydration, and the
 * post-submit moderation hold. All moderation lifecycle state lives here
 * because it resolves from detail-query revisions.
 */
export function useProductDraftData({
  api,
  queryClient,
  productId,
  authEpoch,
  form,
}: {
  api: ApiClient;
  queryClient: QueryClient;
  productId?: string;
  authEpoch: number;
  form: {
    reset: (values: ProductDraftFormValues) => void;
    formState: { isDirty: boolean };
  };
}) {
  const seenAuthEpoch = useRef(authEpoch);
  const hydratedProductId = useRef<string | null>(null);
  const hydratedUpdatedAt = useRef<string | null>(null);
  const detailReads = useRef(0);
  const ignoreDetailReadsBefore = useRef(0);
  const holdFloor = useRef<ProductRevisionIdentity | null>(null);
  const onTrustedDetail = useRef<(revision: TrustedProductRevision) => void>(
    () => undefined,
  );
  const [moderationHold, setModerationHold] = useState(false);
  const [submittedRevision, setSubmittedRevision] =
    useState<ProductRevisionIdentity | null>(null);
  const [trustedRevision, setTrustedRevision] =
    useState<TrustedProductRevision | null>(null);
  const [wizardSubmitted, setWizardSubmitted] = useState(false);
  onTrustedDetail.current = (revision) => {
    setTrustedRevision((current) => {
      if (
        current &&
        current.id === revision.id &&
        current.version === revision.version &&
        current.status === revision.status &&
        current.updatedAt === revision.updatedAt
      ) {
        return current;
      }
      return revision;
    });
  };

  const categories = useQuery({
    queryKey: categoryKeys.all,
    queryFn: ({ signal }) => api.categories.list({ signal }),
  });
  const [catalogOpenRole, setCatalogOpenRole] = useState<
    'MATERIAL' | 'TECHNIQUE' | null
  >(null);
  const materialsCatalog = useQuery({
    queryKey: catalogKeys.terms('MATERIAL'),
    queryFn: ({ signal }) => api.catalog.listTerms('MATERIAL', { signal }),
    enabled: catalogOpenRole === 'MATERIAL',
  });
  const techniquesCatalog = useQuery({
    queryKey: catalogKeys.terms('TECHNIQUE'),
    queryFn: ({ signal }) => api.catalog.listTerms('TECHNIQUE', { signal }),
    enabled: catalogOpenRole === 'TECHNIQUE',
  });
  const productDetail = useQuery({
    queryKey: productId
      ? ownerWorkQueryKeys.detail(productId)
      : ownerWorkQueryKeys.detailRoot,
    queryFn: async ({ signal }) => {
      detailReads.current += 1;
      const readId = detailReads.current;
      const epoch = currentAuthEpoch(queryClient);
      const result = await api.sellers.getProduct(productId!);
      const current = queryClient.getQueryData<SellerProductDetailResponse>(
        ownerWorkQueryKeys.detail(productId!),
      );
      const staleRead =
        signal.aborted || readId <= ignoreDetailReadsBefore.current;
      if (!canWritePrivateCache(queryClient, epoch) || staleRead) {
        if (current) return current;
        throw new Error('Private cache is closed');
      }
      const committed =
        current && shouldKeepCachedProductRevision(current, result)
          ? current
          : result;
      if (ignoreDetailReadsBefore.current > 0 && committed.editingRevision) {
        onTrustedDetail.current(committed.editingRevision);
      }
      return committed;
    },
    enabled: Boolean(productId),
  });
  const existingProduct = productDetail.data?.product;
  const persistedRevisionUpdatedAt =
    productDetail.data?.editingRevision?.updatedAt;
  const editingRevisionStatus = productDetail.data?.editingRevision?.status;
  const productStatus = existingProduct?.status;
  const editorStatus =
    productStatus === 'APPROVED' || productStatus === 'ARCHIVED'
      ? editingRevisionStatus
      : productStatus;
  const storyNeedsDraft =
    (existingProduct?.status === 'APPROVED' ||
      existingProduct?.status === 'ARCHIVED') &&
    editingRevisionStatus === 'APPROVED';

  useEffect(() => {
    if (seenAuthEpoch.current === authEpoch) return;
    seenAuthEpoch.current = authEpoch;
    detailReads.current += 1;
    ignoreDetailReadsBefore.current = detailReads.current;
    holdFloor.current = null;
    setModerationHold(false);
    setSubmittedRevision(null);
    setTrustedRevision(null);
    setWizardSubmitted(false);
    hydratedProductId.current = null;
    hydratedUpdatedAt.current = null;
  }, [authEpoch]);

  useEffect(() => {
    if (!existingProduct) return;
    if (
      !shouldHydrateProductDraft({
        hydratedProductId: hydratedProductId.current,
        hydratedUpdatedAt: hydratedUpdatedAt.current,
        nextProductId: existingProduct.id,
        nextUpdatedAt: persistedRevisionUpdatedAt ?? existingProduct.updatedAt,
        isDirty: form.formState.isDirty,
      })
    ) {
      return;
    }
    form.reset(
      productToDraftFormValues(existingProduct, productDetail.data?.selection),
    );
    hydratedProductId.current = existingProduct.id;
    hydratedUpdatedAt.current =
      persistedRevisionUpdatedAt ?? existingProduct.updatedAt;
  }, [
    existingProduct,
    productDetail.data?.selection,
    form,
    form.formState.isDirty,
    persistedRevisionUpdatedAt,
  ]);

  useEffect(() => {
    if (!moderationHold || !trustedRevision) return;
    const decision = nextPostSubmitHold(holdFloor.current, trustedRevision);
    if (decision.open) {
      holdFloor.current = null;
      setModerationHold(false);
      setSubmittedRevision(null);
      setTrustedRevision(null);
      setWizardSubmitted(false);
      return;
    }
    holdFloor.current = decision.floor;
    setSubmittedRevision((current) =>
      current &&
      current.id === decision.floor.id &&
      current.version === decision.floor.version &&
      current.updatedAt === decision.floor.updatedAt
        ? current
        : decision.floor,
    );
  }, [moderationHold, trustedRevision]);

  useEffect(() => {
    if (!moderationHold || !submittedRevision) return;
    const incoming = productDetail.data?.editingRevision;
    if (!incoming || !isNewerModerationDecision(submittedRevision, incoming))
      return;
    holdFloor.current = null;
    setModerationHold(false);
    setSubmittedRevision(null);
    setTrustedRevision(null);
    setWizardSubmitted(false);
  }, [moderationHold, productDetail.data?.editingRevision, submittedRevision]);

  const notePersisted = (product: Product) => {
    const cached = queryClient.getQueryData<SellerProductDetailResponse>(
      ownerWorkQueryKeys.detail(product.id),
    );
    hydratedProductId.current = product.id;
    hydratedUpdatedAt.current =
      cached?.editingRevision?.updatedAt ??
      cached?.product.updatedAt ??
      product.updatedAt;
  };

  const noteSubmitted = async (
    product: Product,
    isCurrent: () => boolean,
  ): Promise<void> => {
    ignoreDetailReadsBefore.current = detailReads.current;
    setModerationHold(true);
    setTrustedRevision(null);
    setWizardSubmitted(true);
    await queryClient.cancelQueries({
      queryKey: ownerWorkQueryKeys.detail(product.id),
    });
    if (!isCurrent()) return;
    const settled = queryClient.getQueryData<SellerProductDetailResponse>(
      ownerWorkQueryKeys.detail(product.id),
    );
    const settledRevision = settled?.editingRevision;
    holdFloor.current = settledRevision
      ? {
          id: settledRevision.id,
          version: settledRevision.version,
          updatedAt: settledRevision.updatedAt,
        }
      : null;
    setSubmittedRevision(holdFloor.current);
    try {
      await invalidateOwnerWorks(queryClient, product.id);
    } catch {
      return;
    }
  };

  return {
    categories,
    setCatalogOpenRole,
    materialsCatalog,
    techniquesCatalog,
    productDetail,
    existingProduct,
    editingRevisionStatus,
    editorStatus,
    storyNeedsDraft,
    moderationHold,
    submittedRevision,
    wizardSubmitted,
    notePersisted,
    noteSubmitted,
  };
}

export type ProductDraftData = ReturnType<typeof useProductDraftData>;
