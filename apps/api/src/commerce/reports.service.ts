import {
  ApiErrorCode,
  COMMERCE_LIMITS,
  REPORT_REASONS,
  type AdminReport,
  type CreateReportRequest,
  type Report,
  type ResolveReportRequest,
} from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';
import { Injectable, NotFoundException } from '@nestjs/common';

import { AntifraudService } from '../antifraud';
import { PrismaService, runReadCommittedTransaction } from '../core/database';
import { AppException } from '../core/errors';
import { dbNow } from '../core/time';
import { enqueueNotification } from '../notifications/notification-outbox';
import { lockProductRowForUpdate } from '../products/product-write-guard';
import { OrdersService } from './orders.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const REPORT_WINDOW_MS = COMMERCE_LIMITS.reportWindowDays * DAY_MS;

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly antifraud: AntifraudService,
    private readonly orders: OrdersService,
  ) {}

  async create(
    userId: string,
    publicId: string,
    input: CreateReportRequest,
  ): Promise<Report> {
    const anchor = await this.prisma.order.findUnique({ where: { publicId } });
    if (
      !anchor ||
      (anchor.buyerUserId !== userId && anchor.sellerUserId !== userId)
    ) {
      throw new NotFoundException('Order not found');
    }
    return runReadCommittedTransaction(this.prisma, async (tx) => {
      await lockProductRowForUpdate(tx, anchor.productId);
      await this.antifraud.lockUsers(tx, [
        anchor.buyerUserId,
        anchor.sellerUserId,
      ]);
      const now = await dbNow(tx);
      const order = await tx.order.findUnique({ where: { id: anchor.id } });
      if (
        !order ||
        (order.buyerUserId !== userId && order.sellerUserId !== userId)
      ) {
        throw new NotFoundException('Order not found');
      }
      if (!reportAllowed(order, now)) {
        throw new AppException({
          status: 409,
          code: ApiErrorCode.CONFLICT,
          message:
            order.status === 'COMPLETED' || order.status === 'FAILED'
              ? 'The report window has closed'
              : 'This order cannot be reported',
        });
      }
      const open = await tx.report.findFirst({
        where: {
          reporterUserId: userId,
          targetType: 'ORDER',
          targetId: order.id,
          status: 'OPEN',
        },
        select: { id: true },
      });
      if (open) {
        throw new AppException({
          status: 409,
          code: ApiErrorCode.CONFLICT,
          message: 'An open report already exists',
        });
      }
      const report = await tx.report.create({
        data: {
          targetType: 'ORDER',
          targetId: order.id,
          reporterUserId: userId,
          reason: input.reason,
          text: input.text ?? null,
          status: 'OPEN',
        },
      });
      await enqueueNotification(tx, {
        userId:
          userId === order.buyerUserId
            ? order.sellerUserId
            : order.buyerUserId,
        kind: 'ORDER_REPORTED',
        payload: {
          orderPublicId: order.publicId,
          reportId: report.id,
          workTitle: order.workTitleSnapshot,
        },
      });
      return toReport(report);
    });
  }

  async list(status?: Report['status']): Promise<{ reports: AdminReport[] }> {
    const rows = await this.prisma.report.findMany({
      where: {
        targetType: 'ORDER',
        ...(status === undefined ? {} : { status }),
      },
      orderBy: { createdAt: 'desc' },
    });
    if (rows.length === 0) return { reports: [] };
    const orders = await this.prisma.order.findMany({
      where: { id: { in: rows.map((row) => row.targetId) } },
      select: {
        id: true,
        publicId: true,
        buyerUserId: true,
        sellerUserId: true,
      },
    });
    const byId = new Map(orders.map((order) => [order.id, order]));
    return {
      reports: rows.map((row) => {
        const order = byId.get(row.targetId);
        if (!order) throw new Error('Order report is missing its order');
        return toAdminReport(row, order);
      }),
    };
  }

  async resolve(
    adminId: string,
    reportId: string,
    input: ResolveReportRequest,
  ): Promise<Report> {
    const anchor = await this.prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!anchor || anchor.targetType !== 'ORDER') {
      throw new NotFoundException('Report not found');
    }
    const order = await this.prisma.order.findUnique({
      where: { id: anchor.targetId },
    });
    if (!order) throw new NotFoundException('Report not found');
    return runReadCommittedTransaction(this.prisma, async (tx) => {
      await lockProductRowForUpdate(tx, order.productId);
      await this.antifraud.lockUsers(tx, [
        adminId,
        order.buyerUserId,
        order.sellerUserId,
      ]);
      const now = await dbNow(tx);
      await this.orders.assertActiveAdmin(tx, adminId);
      const current = await tx.report.findUnique({ where: { id: reportId } });
      if (!current || current.targetType !== 'ORDER') {
        throw new NotFoundException('Report not found');
      }
      const updated = await tx.report.updateMany({
        where: { id: reportId, status: 'OPEN' },
        data: {
          status: input.status,
          faultSide: input.status === 'UPHELD' ? input.faultSide ?? null : null,
          adminNote: input.adminNote,
          resolvedAt: now,
          resolvedById: adminId,
        },
      });
      if (updated.count === 1) {
        if (input.orderAction) {
          await this.orders.commitOutcomeInTransaction(tx, {
            productId: order.productId,
            orderId: order.id,
            actor: 'admin',
            actorUserId: adminId,
            next:
              input.orderAction.to === 'FAILED'
                ? {
                    to: 'FAILED',
                    failReason: input.orderAction.failReason,
                  }
                : { to: 'COMPLETED' },
            adminReason: input.adminNote,
            viewerId: adminId,
            requireAdmin: true,
            card: false,
          });
        }
        await tx.auditEvent.create({
          data: {
            actorUserId: adminId,
            targetType: 'REPORT',
            targetId: reportId,
            oldStatus: 'OPEN',
            newStatus: decisionKey(input),
            reason: `${order.publicId}: ${input.adminNote}`,
            action: 'REPORT_RESOLVE',
          },
        });
      } else if (!sameResolvedDecision(current, input, await storedDecision(tx, reportId))) {
        throw new AppException({
          status: 409,
          code: ApiErrorCode.CONFLICT,
          message: 'Report is already resolved',
        });
      }
      const stored = await tx.report.findUnique({ where: { id: reportId } });
      if (!stored) throw new NotFoundException('Report not found');
      return toReport(stored);
    });
  }
}

function reportAllowed(
  order: {
    status: string;
    completedAt: Date | null;
    failedAt: Date | null;
  },
  now: Date,
): boolean {
  if (order.status === 'ACTIVE') return true;
  if (order.status !== 'COMPLETED' && order.status !== 'FAILED') return false;
  const closedAt =
    order.status === 'COMPLETED' ? order.completedAt : order.failedAt;
  if (!closedAt) return false;
  return now.getTime() - closedAt.getTime() <= REPORT_WINDOW_MS;
}

function decisionKey(input: ResolveReportRequest): string {
  const fault = input.status === 'UPHELD' ? input.faultSide ?? 'NONE' : 'NONE';
  const action = !input.orderAction
    ? 'none'
    : input.orderAction.to === 'COMPLETED'
      ? 'COMPLETED'
      : `FAILED:${input.orderAction.failReason}`;
  return `${input.status}:${fault}|${action}`;
}

function sameResolvedDecision(
  report: { status: string; faultSide: string | null; adminNote: string | null },
  input: ResolveReportRequest,
  storedKey: string | null,
): boolean {
  const fault = input.status === 'UPHELD' ? input.faultSide ?? null : null;
  return (
    report.status === input.status &&
    (report.faultSide ?? null) === fault &&
    report.adminNote === input.adminNote &&
    storedKey === decisionKey(input)
  );
}

async function storedDecision(
  tx: Prisma.TransactionClient,
  reportId: string,
): Promise<string | null> {
  const audit = await tx.auditEvent.findFirst({
    where: { targetType: 'REPORT', targetId: reportId, action: 'REPORT_RESOLVE' },
    select: { newStatus: true },
  });
  return audit?.newStatus ?? null;
}

function toAdminReport(
  row: Prisma.ReportGetPayload<true>,
  order: {
    publicId: string;
    buyerUserId: string;
    sellerUserId: string;
  },
): AdminReport {
  return {
    ...toReport(row),
    orderPublicId: order.publicId,
    reporterUserId: row.reporterUserId,
    buyerUserId: order.buyerUserId,
    sellerUserId: order.sellerUserId,
    adminNote: row.adminNote,
  };
}

function toReport(row: Prisma.ReportGetPayload<true>): Report {
  const reason = REPORT_REASONS.find((value) => value === row.reason);
  if (!reason) throw new Error(`Unknown report reason ${row.reason}`);
  return {
    id: row.id,
    targetType: row.targetType,
    targetId: row.targetId,
    reason,
    text: row.text,
    status: row.status,
    faultSide: row.faultSide,
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
  };
}
