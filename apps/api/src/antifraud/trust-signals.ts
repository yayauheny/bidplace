import type { TrustSignals } from '@bidplace/contracts';
import { Prisma, PrismaClient } from '@bidplace/database';
import { NotFoundException } from '@nestjs/common';

import { dbNow } from '../core/time';
import { isActiveBuyerStrike, strikeMark } from './antifraud.policy';

export async function getTrustSignals(
  db: Prisma.TransactionClient | PrismaClient,
  userId: string,
): Promise<TrustSignals> {
  const now = await dbNow(db);
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { createdAt: true, emailVerifiedAt: true },
  });
  if (!user) throw new NotFoundException('User not found');

  const completedAsSeller = await db.order.count({
    where: { sellerUserId: userId, status: 'COMPLETED' },
  });
  const completedAsBuyer = await db.order.count({
    where: { buyerUserId: userId, status: 'COMPLETED' },
  });
  const sellerFaultFailures = await db.order.count({
    where: { sellerUserId: userId, status: 'FAILED', faultSide: 'SELLER' },
  });
  const buyerFailures = await db.order.findMany({
    where: {
      buyerUserId: userId,
      status: 'FAILED',
      faultSide: 'BUYER',
      strikeVoidedAt: null,
    },
    select: { id: true, failReason: true, failedAt: true, failedBy: true },
  });
  const openReports =
    buyerFailures.length === 0
      ? []
      : await db.report.findMany({
          where: {
            targetType: 'ORDER',
            targetId: { in: buyerFailures.map((order) => order.id) },
            reporterUserId: userId,
            status: 'OPEN',
          },
          select: { targetId: true },
        });
  const open = new Set(openReports.map((report) => report.targetId));
  const buyerStrikes = buyerFailures.filter((order) =>
    isActiveBuyerStrike(
      {
        failReason: order.failReason,
        failedAt: order.failedAt,
        buyerReportOpen: open.has(order.id),
        markedBy: strikeMark(order.failedBy),
      },
      now,
    ),
  ).length;

  const partyOrders = await db.order.findMany({
    where: {
      OR: [{ buyerUserId: userId }, { sellerUserId: userId }],
    },
    select: { id: true, buyerUserId: true, sellerUserId: true },
  });
  const upheldOrders =
    partyOrders.length === 0
      ? []
      : await db.report.findMany({
          where: {
            status: 'UPHELD',
            targetType: 'ORDER',
            targetId: { in: partyOrders.map((order) => order.id) },
          },
          select: { targetId: true, faultSide: true },
        });
  const byId = new Map(partyOrders.map((order) => [order.id, order]));
  const upheldOnOrders = upheldOrders.filter((report) => {
    const order = byId.get(report.targetId);
    if (!order) return false;
    if (report.faultSide === 'BUYER') return order.buyerUserId === userId;
    if (report.faultSide === 'SELLER') return order.sellerUserId === userId;
    return false;
  }).length;
  const upheldOnUser = await db.report.count({
    where: { status: 'UPHELD', targetType: 'USER', targetId: userId },
  });

  return {
    completedAsSeller,
    completedAsBuyer,
    buyerStrikes,
    sellerFaultFailures,
    upheldReportsAgainst: upheldOnOrders + upheldOnUser,
    memberSince: user.createdAt.toISOString(),
    emailVerified: user.emailVerifiedAt !== null,
  };
}
