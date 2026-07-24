import {
  type HandoffContactType,
  type HandoffInitiator,
} from '@bidplace/contracts';

export type OrderSnapshot = {
  sellerHandoffType: HandoffContactType;
  sellerHandoffValue: string;
  buyerEmailAtClose: string;
  handoffInitiator: HandoffInitiator;
};

export function createOrderSnapshot(input: {
  sellerHandoffType: HandoffContactType;
  sellerHandoffValue: string;
  buyerEmailAtClose: string;
  handoffInitiator: HandoffInitiator;
}): OrderSnapshot {
  return {
    sellerHandoffType: input.sellerHandoffType,
    sellerHandoffValue: input.sellerHandoffValue,
    buyerEmailAtClose: input.buyerEmailAtClose,
    handoffInitiator: input.handoffInitiator,
  };
}
