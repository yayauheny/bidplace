import {
  type HandoffContactType,
  type HandoffInitiator,
} from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';

import {
  getPrismaUniqueConstraintTargets,
  isPrismaUniqueConstraintError,
  runSerializableTransaction,
} from '../core/database';
import { createOrderSnapshot } from './order-snapshot';

export const WINNER_BID_ORDER_BY = [
  { amount: 'desc' as const },
  { createdAt: 'asc' as const },
  { id: 'asc' as const },
];

type WinnerOrderRecord = Prisma.OrderGetPayload<object>;

type WinnerOrderPrisma = {
  $transaction: Parameters<typeof runSerializableTransaction>[0]['$transaction'];
  order: {
    findUnique: (args: {
      where: { sourceBidId: string };
    }) => Promise<WinnerOrderRecord | null>;
  };
};

export type CreateWinnerOrderInput = {
  listingId: string;
  sellerId: string;
  buyerId: string;
  sourceBidId: string;
  finalAmount: Prisma.Decimal;
  contactDueAt: Date;
  sellerHandoffType: HandoffContactType;
  sellerHandoffValue: string;
  buyerEmailAtClose: string;
  handoffInitiator: HandoffInitiator;
  generatePublicId: () => string;
};

export type CreateWinnerOrderResult =
  | { status: 'created'; order: WinnerOrderRecord }
  | { status: 'already_exists'; order: WinnerOrderRecord };

export type CreateWinnerOrderOptions = {
  onCreated?: (
    tx: Prisma.TransactionClient,
    order: WinnerOrderRecord,
  ) => Promise<void>;
};

export class WinnerOrderPublicIdExhaustedError extends Error {
  constructor(listingId: string) {
    super(
      `Could not assign Order public identifier for Listing ${listingId}`,
    );
    this.name = 'WinnerOrderPublicIdExhaustedError';
  }
}

const PUBLIC_ID_TARGETS = new Set([
  'publicId',
  'public_id',
  'orders_public_id_key',
]);

const SOURCE_BID_TARGETS = new Set([
  'sourceBidId',
  'source_bid_id',
  'orders_source_bid_id_key',
]);

function targetsInclude(
  targets: string[],
  candidates: ReadonlySet<string>,
): boolean {
  return targets.some((target) => candidates.has(target));
}

export async function createWinnerOrder(
  prisma: WinnerOrderPrisma,
  input: CreateWinnerOrderInput,
  options?: CreateWinnerOrderOptions,
): Promise<CreateWinnerOrderResult> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await runSerializableTransaction(prisma, async (tx) => {
        const existing = await tx.order.findUnique({
          where: { sourceBidId: input.sourceBidId },
        });
        if (existing) {
          return { status: 'already_exists' as const, order: existing };
        }

        const order = await tx.order.create({
          data: {
            publicId: input.generatePublicId(),
            listingId: input.listingId,
            sellerId: input.sellerId,
            buyerId: input.buyerId,
            sourceBidId: input.sourceBidId,
            finalAmount: input.finalAmount,
            contactDueAt: input.contactDueAt,
            ...createOrderSnapshot({
              sellerHandoffType: input.sellerHandoffType,
              sellerHandoffValue: input.sellerHandoffValue,
              buyerEmailAtClose: input.buyerEmailAtClose,
              handoffInitiator: input.handoffInitiator,
            }),
          },
        });
        if (options?.onCreated) {
          await options.onCreated(tx, order);
        }
        return { status: 'created' as const, order };
      });
    } catch (error) {
      if (!isPrismaUniqueConstraintError(error)) {
        throw error;
      }

      const targets = getPrismaUniqueConstraintTargets(error);

      if (targetsInclude(targets, SOURCE_BID_TARGETS) || targets.length === 0) {
        const bySourceBid = await prisma.order.findUnique({
          where: { sourceBidId: input.sourceBidId },
        });
        if (bySourceBid) {
          return { status: 'already_exists', order: bySourceBid };
        }
        if (targetsInclude(targets, SOURCE_BID_TARGETS)) {
          throw error;
        }
        // Empty targets and no sourceBid row: treat as publicId collision.
      }

      if (
        targetsInclude(targets, PUBLIC_ID_TARGETS) ||
        targets.length === 0
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new WinnerOrderPublicIdExhaustedError(input.listingId);
}
