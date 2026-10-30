import { describe, expect, it } from 'vitest';

import { getTrustSignals } from './trust-signals';

const now = new Date('2026-10-30T12:00:00.000Z');
const recent = new Date(now.getTime() - 60 * 60 * 1000);
const aged = new Date(now.getTime() - 73 * 60 * 60 * 1000);

type OrderRow = {
  id: string;
  sellerUserId: string;
  buyerUserId: string;
  status: string;
  faultSide: string | null;
  failReason: string | null;
  failedAt: Date | null;
  failedBy: string | null;
  strikeVoidedAt: Date | null;
};

type ReportRow = {
  targetType: string;
  targetId: string;
  reporterUserId: string;
  status: string;
  faultSide: string | null;
};

function matches(
  row: Record<string, unknown>,
  where: Record<string, unknown>,
): boolean {
  return Object.entries(where).every(([key, expected]) => {
    if (
      expected !== null &&
      typeof expected === 'object' &&
      'in' in (expected as object)
    ) {
      return (expected as { in: unknown[] }).in.includes(row[key]);
    }
    return row[key] === expected;
  });
}

function database(input: { orders: OrderRow[]; reports: ReportRow[] }) {
  const user = {
    id: 'user-1',
    createdAt: new Date('2024-01-02T00:00:00.000Z'),
    emailVerifiedAt: new Date('2024-01-03T00:00:00.000Z'),
  };
  return {
    $queryRaw: async () => [{ now }],
    user: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        where.id === user.id ? user : null,
    },
    sellerProfile: {
      findUnique: async () => null,
    },
    order: {
      count: async ({ where }: { where: Record<string, unknown> }) =>
        input.orders.filter((row) => matches(row, where)).length,
      findMany: async ({ where }: { where: Record<string, unknown> }) =>
        input.orders.filter((row) => matches(row, where)),
    },
    report: {
      count: async ({ where }: { where: Record<string, unknown> }) =>
        input.reports.filter((row) => matches(row, where)).length,
      findMany: async ({ where }: { where: Record<string, unknown> }) =>
        input.reports.filter((row) => matches(row, where)),
    },
  };
}

const buyerFault = (
  id: string,
  failReason: string,
  failedAt: Date,
  failedBy: string,
  strikeVoidedAt: Date | null = null,
): OrderRow => ({
  id,
  sellerUserId: 'seller-1',
  buyerUserId: 'user-1',
  status: 'FAILED',
  faultSide: 'BUYER',
  failReason,
  failedAt,
  failedBy,
  strikeVoidedAt,
});

describe('getTrustSignals', () => {
  it.each([
    {
      label: 'no commerce history',
      orders: [],
      reports: [],
      signals: {
        completedAsSeller: 0,
        completedAsBuyer: 0,
        buyerStrikes: 0,
        sellerFaultFailures: 0,
        upheldReportsAgainst: 0,
      },
    },
    {
      label: 'completed sales on each side',
      orders: [
        {
          id: 'sold',
          sellerUserId: 'user-1',
          buyerUserId: 'other',
          status: 'COMPLETED',
          faultSide: null,
          failReason: null,
          failedAt: null,
          failedBy: null,
          strikeVoidedAt: null,
        },
        {
          id: 'bought-1',
          sellerUserId: 'other',
          buyerUserId: 'user-1',
          status: 'COMPLETED',
          faultSide: null,
          failReason: null,
          failedAt: null,
          failedBy: null,
          strikeVoidedAt: null,
        },
        {
          id: 'bought-2',
          sellerUserId: 'other',
          buyerUserId: 'user-1',
          status: 'COMPLETED',
          faultSide: null,
          failReason: null,
          failedAt: null,
          failedBy: null,
          strikeVoidedAt: null,
        },
      ],
      reports: [],
      signals: {
        completedAsSeller: 1,
        completedAsBuyer: 2,
        buyerStrikes: 0,
        sellerFaultFailures: 0,
        upheldReportsAgainst: 0,
      },
    },
    {
      label: 'two immediate buyer refusals',
      orders: [
        buyerFault('a', 'BUYER_REFUSED', recent, 'buyer'),
        buyerFault('b', 'BUYER_REFUSED', recent, 'buyer'),
      ],
      reports: [],
      signals: {
        completedAsSeller: 0,
        completedAsBuyer: 0,
        buyerStrikes: 2,
        sellerFaultFailures: 0,
        upheldReportsAgainst: 0,
      },
    },
    {
      label: 'a fresh seller mark is not a strike yet',
      orders: [
        buyerFault('a', 'BUYER_NO_CONTACT', recent, 'seller'),
        buyerFault('b', 'BUYER_REFUSED', recent, 'seller'),
      ],
      reports: [],
      signals: {
        completedAsSeller: 0,
        completedAsBuyer: 0,
        buyerStrikes: 0,
        sellerFaultFailures: 0,
        upheldReportsAgainst: 0,
      },
    },
    {
      label: 'an aged seller mark counts unless the buyer report is open',
      orders: [
        buyerFault('open', 'BUYER_INVALID_CONTACTS', aged, 'seller'),
        buyerFault('closed', 'BUYER_NO_CONTACT', aged, 'seller'),
      ],
      reports: [
        {
          targetType: 'ORDER',
          targetId: 'open',
          reporterUserId: 'user-1',
          status: 'OPEN',
          faultSide: null,
        },
      ],
      signals: {
        completedAsSeller: 0,
        completedAsBuyer: 0,
        buyerStrikes: 1,
        sellerFaultFailures: 0,
        upheldReportsAgainst: 0,
      },
    },
    {
      label: 'a voided strike and a seller-fault failure stay out of buyer strikes',
      orders: [
        buyerFault('void', 'BUYER_REFUSED', recent, 'buyer', now),
        {
          id: 'seller-fault',
          sellerUserId: 'user-1',
          buyerUserId: 'other',
          status: 'FAILED',
          faultSide: 'SELLER',
          failReason: 'SELLER_REFUSED',
          failedAt: recent,
          failedBy: 'seller',
          strikeVoidedAt: null,
        },
      ],
      reports: [
        {
          targetType: 'ORDER',
          targetId: 'seller-fault',
          reporterUserId: 'other',
          status: 'UPHELD',
          faultSide: 'SELLER',
        },
      ],
      signals: {
        completedAsSeller: 0,
        completedAsBuyer: 0,
        buyerStrikes: 0,
        sellerFaultFailures: 1,
        upheldReportsAgainst: 1,
      },
    },
    {
      label: 'an upheld report about another person is not against this user',
      orders: [],
      reports: [
        {
          targetType: 'USER',
          targetId: 'someone-else',
          reporterUserId: 'user-1',
          status: 'UPHELD',
          faultSide: 'BUYER',
        },
      ],
      signals: {
        completedAsSeller: 0,
        completedAsBuyer: 0,
        buyerStrikes: 0,
        sellerFaultFailures: 0,
        upheldReportsAgainst: 0,
      },
    },
  ])('$label', async ({ orders, reports, signals }) => {
    const result = await getTrustSignals(
      database({ orders, reports }) as never,
      'user-1',
    );
    expect(result).toMatchObject(signals);
    expect(result.memberSince).toBe('2024-01-02T00:00:00.000Z');
    expect(result.emailVerified).toBe(true);
  });
});
