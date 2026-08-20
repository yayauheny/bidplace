import { useEffect } from 'react';

import { useAnalytics } from '../../providers/analytics-provider';

export function useTrackListingView(input: {
  productPublicId: string;
  listingId?: string;
  sellerProfileId?: string;
  enabled: boolean;
}): void {
  const analytics = useAnalytics();
  const { productPublicId, listingId, sellerProfileId, enabled } = input;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    analytics.track('listing_viewed', {
      productPublicId,
      ...(listingId ? { listingId } : {}),
      ...(sellerProfileId ? { sellerProfileId } : {}),
    });
  }, [analytics, enabled, listingId, productPublicId, sellerProfileId]);
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
