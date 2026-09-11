import { useEffect } from 'react';

import { useAnalytics } from '../../providers/analytics-provider';

export function useTrackWorkView(input: {
  productPublicId: string;
  sellerProfileId?: string;
  enabled: boolean;
}): void {
  const analytics = useAnalytics();
  const { productPublicId, sellerProfileId, enabled } = input;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    analytics.track('work_viewed', {
      productPublicId,
      ...(sellerProfileId ? { sellerProfileId } : {}),
    });
  }, [analytics, enabled, productPublicId, sellerProfileId]);
}

export function useTrackSellerView(input: {
  sellerProfileId?: string;
  sellerSlug?: string;
  enabled: boolean;
}): void {
  const analytics = useAnalytics();
  const { sellerProfileId, sellerSlug, enabled } = input;

  useEffect(() => {
    if (!enabled || !sellerProfileId) {
      return;
    }

    analytics.track('seller_viewed', {
      sellerProfileId,
      ...(sellerSlug ? { sellerSlug } : {}),
    });
  }, [analytics, enabled, sellerProfileId, sellerSlug]);
}
