import { useEffect } from 'react';
import type { PublicLot } from '@bidplace/contracts';

import { BidHistorySheet } from './BidHistorySheet';
import { BidSheet } from './BidSheet';
import { PurchaseDialog } from './PurchaseDialog';
import { usePlaceBid, usePurchase } from './use-lot-actions';

export function LotCommerce({
  publicId,
  lot,
  title,
  imageUrl,
  mode,
  onClose,
}: {
  publicId: string;
  lot: PublicLot | null;
  title: string;
  imageUrl: string | null;
  mode: 'bid' | 'buy' | 'history' | null;
  onClose: () => void;
}) {
  const auctionId = lot?.type === 'AUCTION' ? lot.id : null;
  const fixedId = lot?.type === 'FIXED' ? lot.id : null;
  const bid = usePlaceBid(publicId, auctionId);
  const purchase = usePurchase(publicId, fixedId);
  useEffect(() => {
    if (mode === 'bid') bid.reset();
    if (mode === 'buy') purchase.reset();
  }, [mode, bid.reset, purchase.reset]);
  return (
    <>
      <BidSheet
        open={mode === 'bid'}
        lot={lot?.type === 'AUCTION' ? lot : null}
        pending={bid.pending}
        error={bid.error}
        onClose={onClose}
        onSubmit={bid.submit}
      />
      <PurchaseDialog
        open={mode === 'buy'}
        lot={lot?.type === 'FIXED' ? lot : null}
        title={title}
        imageUrl={imageUrl}
        pending={purchase.pending}
        error={purchase.error}
        onClose={onClose}
        onSubmit={purchase.submit}
      />
      <BidHistorySheet
        open={mode === 'history'}
        listingId={auctionId}
        currency={lot?.currency ?? 'BYN'}
        onClose={onClose}
      />
    </>
  );
}
