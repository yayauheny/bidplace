import {
  type HandoffContactType,
  type HandoffInitiator,
} from '@bidplace/contracts';

export class IncompleteOrderSnapshotError extends Error {
  constructor(message = 'Order deal snapshot is incomplete') {
    super(message);
    this.name = 'IncompleteOrderSnapshotError';
  }
}

export type OrderContactSnapshot = {
  sellerHandoffType: HandoffContactType;
  sellerHandoffValue: string;
  buyerEmailAtClose: string;
  handoffInitiator: HandoffInitiator;
};

export type OrderDealSnapshot = {
  snapshotTitle: string;
  snapshotCurrency: string;
  snapshotProductPublicId: string;
};

export type OrderSnapshot = OrderContactSnapshot & OrderDealSnapshot;

type ListingDealReader = {
  listing: {
    findUnique: (args: {
      where: { id: string };
      select: {
        currency: true;
        product: { select: { title: true; publicId: true } };
      };
    }) => Promise<{
      currency: string;
      product: { title: string | null; publicId: string };
    } | null>;
  };
};

export function createOrderSnapshot(input: OrderSnapshot): OrderSnapshot {
  const snapshotTitle = input.snapshotTitle.trim();
  const snapshotCurrency = input.snapshotCurrency.trim();
  const snapshotProductPublicId = input.snapshotProductPublicId.trim();
  const sellerHandoffValue = input.sellerHandoffValue.trim();
  const buyerEmailAtClose = input.buyerEmailAtClose.trim();

  if (
    !snapshotTitle ||
    snapshotTitle.length > 200 ||
    !/^[A-Z]{3}$/.test(snapshotCurrency) ||
    !snapshotProductPublicId ||
    !sellerHandoffValue ||
    !buyerEmailAtClose
  ) {
    throw new IncompleteOrderSnapshotError();
  }

  return {
    sellerHandoffType: input.sellerHandoffType,
    sellerHandoffValue,
    buyerEmailAtClose,
    handoffInitiator: input.handoffInitiator,
    snapshotTitle,
    snapshotCurrency,
    snapshotProductPublicId,
  };
}

export async function loadOrderDealSnapshot(
  tx: ListingDealReader,
  listingId: string,
): Promise<OrderDealSnapshot> {
  const listing = await tx.listing.findUnique({
    where: { id: listingId },
    select: {
      currency: true,
      product: { select: { title: true, publicId: true } },
    },
  });
  const snapshotTitle = listing?.product.title?.trim() ?? '';
  const snapshotCurrency = listing?.currency.trim() ?? '';
  const snapshotProductPublicId = listing?.product.publicId.trim() ?? '';

  if (
    !snapshotTitle ||
    snapshotTitle.length > 200 ||
    !/^[A-Z]{3}$/.test(snapshotCurrency) ||
    !snapshotProductPublicId
  ) {
    throw new IncompleteOrderSnapshotError();
  }

  return {
    snapshotTitle,
    snapshotCurrency,
    snapshotProductPublicId,
  };
}

export function resolveOrderDealFields(order: {
  snapshotTitle: string | null;
  snapshotCurrency: string | null;
  snapshotProductPublicId: string | null;
  listing: {
    currency: string;
    product: { title: string | null; publicId: string };
  };
}): { title: string; currency: string; productPublicId: string } {
  const title = order.snapshotTitle?.trim() || order.listing.product.title?.trim();
  const currency = order.snapshotCurrency?.trim() || order.listing.currency.trim();
  const productPublicId =
    order.snapshotProductPublicId?.trim() || order.listing.product.publicId.trim();

  if (!title || !currency || !productPublicId) {
    throw new IncompleteOrderSnapshotError();
  }

  return { title, currency, productPublicId };
}
