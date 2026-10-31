import {
  ATTENTION_KINDS,
  adminUserSchema,
  COMMERCE_LIMITS,
} from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';
import { Injectable } from '@nestjs/common';

import { AntifraudService } from '../antifraud';
import { PrismaService } from '../core/database';
import { dbNow } from '../core/time';
import {
  toAdminOrderDetail,
  type AdminOrderRow,
} from './commerce.mapper';

type AttentionKind = (typeof ATTENTION_KINDS)[number];

type AttentionItem = {
  kind: AttentionKind;
  orderPublicId: string | null;
  listingId: string | null;
  productId: string | null;
};

type OrderPointer = {
  orderPublicId: string;
  listingId: string;
  productId: string;
};

@Injectable()
export class AttentionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly antifraud: AntifraudService,
  ) {}

  async forUser(userId: string): Promise<{ items: AttentionItem[] }> {
    const [offers, active, reports, choices, contacts] = await Promise.all([
      this.offers(userId),
      this.activeOrders(userId),
      this.openReports(userId),
      this.auctionChoices(userId),
      this.contactsRequired(userId),
    ]);
    return {
      items: [...offers, ...active, ...reports, ...choices, ...contacts],
    };
  }

  async forAdmin() {
    const now = await dbNow(this.prisma);
    const hours = COMMERCE_LIMITS.adminAttentionHours;
    const [reportedOrders, unmarkedOrders, holds] = await Promise.all([
      this.adminOrders(Prisma.sql`
        EXISTS (
          SELECT 1
          FROM reports r
          WHERE r.target_id = o.id
            AND r.target_type = 'ORDER'::"ReportTarget"
            AND r.status = 'OPEN'::"ReportStatus"
        )
      `),
      this.adminOrders(Prisma.sql`
        o.status = 'ACTIVE'::"OrderStatus"
        AND o.activated_at <= (${now}::timestamptz AT TIME ZONE 'UTC') - (${hours} * interval '1 hour')
      `),
      this.antifraud.listActiveHolds(),
    ]);
    const seen = new Set<string>();
    const blocks = [];
    for (const user of holds) {
      if (seen.has(user.id)) continue;
      seen.add(user.id);
      blocks.push(adminUserSchema.parse(user));
    }
    return {
      reportedOrders: reportedOrders.map(toAdminOrderDetail),
      unmarkedOrders: unmarkedOrders.map(toAdminOrderDetail),
      blocks,
    };
  }

  private async offers(userId: string): Promise<AttentionItem[]> {
    const rows = await this.prisma.order.findMany({
      where: { buyerUserId: userId, status: 'OFFERED' },
      orderBy: { createdAt: 'desc' },
      select: { publicId: true, listingId: true, productId: true },
    });
    return rows.map((row) => this.item('OFFER', row));
  }

  private async activeOrders(userId: string): Promise<AttentionItem[]> {
    const rows = await this.prisma.order.findMany({
      where: { sellerUserId: userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      select: { publicId: true, listingId: true, productId: true },
    });
    return rows.map((row) => this.item('ACTIVE_ORDER', row));
  }

  private async openReports(userId: string): Promise<AttentionItem[]> {
    const rows = await this.prisma.$queryRaw<OrderPointer[]>`
      SELECT o.public_id AS "orderPublicId",
             o.listing_id AS "listingId",
             o.product_id AS "productId"
      FROM orders o
      WHERE (o.buyer_user_id = ${userId}::uuid OR o.seller_user_id = ${userId}::uuid)
        AND EXISTS (
          SELECT 1
          FROM reports r
          WHERE r.target_id = o.id
            AND r.target_type = 'ORDER'::"ReportTarget"
            AND r.status = 'OPEN'::"ReportStatus"
        )
      ORDER BY o.created_at DESC
    `;
    return rows.map((row) => this.item('OPEN_REPORT', row));
  }

  private async auctionChoices(userId: string): Promise<AttentionItem[]> {
    const rows = await this.prisma.$queryRaw<OrderPointer[]>`
      SELECT l.id AS "listingId",
             l.product_id AS "productId",
             failed.public_id AS "orderPublicId"
      FROM listings l
      INNER JOIN products p ON p.id = l.product_id AND p.deleted_at IS NULL
      INNER JOIN LATERAL (
        SELECT o.public_id
        FROM orders o
        WHERE o.listing_id = l.id
          AND o.status = 'FAILED'::"OrderStatus"
        ORDER BY o.failed_at DESC NULLS LAST, o.created_at DESC
        LIMIT 1
      ) failed ON true
      WHERE l.seller_user_id = ${userId}::uuid
        AND l.type = 'AUCTION'::"ListingType"
        AND l.status = 'ENDED'::"ListingStatus"
        AND EXISTS (
          SELECT 1
          FROM orders o
          WHERE o.listing_id = l.id
            AND o.status = 'FAILED'::"OrderStatus"
            AND o.fault_side = 'BUYER'::"FaultSide"
        )
        AND NOT EXISTS (
          SELECT 1
          FROM orders o
          WHERE o.listing_id = l.id
            AND o.status IN ('OFFERED'::"OrderStatus", 'ACTIVE'::"OrderStatus")
        )
        AND NOT EXISTS (
          SELECT 1
          FROM listings later
          WHERE later.product_id = l.product_id
            AND later.created_at > l.created_at
        )
      ORDER BY l.created_at DESC
    `;
    return rows.map((row) => this.item('AUCTION_CHOICE', row));
  }

  private async contactsRequired(userId: string): Promise<AttentionItem[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        contactPhone: true,
        contactTelegram: true,
        contactInstagram: true,
        contactVk: true,
      },
    });
    if (
      !user ||
      user.role === 'admin' ||
      this.antifraud.hasBuyerContact([
        user.contactPhone,
        user.contactTelegram,
        user.contactInstagram,
        user.contactVk,
      ])
    ) {
      return [];
    }
    return [
      {
        kind: 'CONTACTS_REQUIRED',
        orderPublicId: null,
        listingId: null,
        productId: null,
      },
    ];
  }

  private item(
    kind: AttentionKind,
    row: { publicId?: string; orderPublicId?: string; listingId: string; productId: string },
  ): AttentionItem {
    return {
      kind,
      orderPublicId: row.orderPublicId ?? row.publicId ?? null,
      listingId: row.listingId,
      productId: row.productId,
    };
  }

  private async adminOrders(where: Prisma.Sql): Promise<AdminOrderRow[]> {
    return this.prisma.$queryRaw<AdminOrderRow[]>`
      SELECT
        o.public_id AS "publicId",
        o.deal_code AS "dealCode",
        o.status::text AS status,
        o.source::text AS source,
        o.amount_minor AS "amountMinor",
        o.currency,
        o.work_title_snapshot AS "workTitle",
        o.work_public_id_snapshot AS "workPublicId",
        CASE WHEN product.deleted_at IS NULL THEN o.cover_image_id_snapshot ELSE NULL END AS "coverImageId",
        o.created_at AS "createdAt",
        o.contact_deadline_at AS "contactDeadlineAt",
        o.offer_expires_at AS "offerExpiresAt",
        o.buyer_comment AS "buyerComment",
        o.seller_note AS "sellerNote",
        o.fail_reason::text AS "failReason",
        o.fault_side::text AS "faultSide",
        o.completed_at AS "completedAt",
        o.failed_at AS "failedAt",
        buyer.email AS "buyerEmail",
        buyer.contact_phone AS "buyerPhone",
        buyer.contact_telegram AS "buyerTelegram",
        buyer.contact_instagram AS "buyerInstagram",
        buyer.contact_vk AS "buyerVk",
        seller.email AS "sellerEmail",
        seller.contact_phone AS "sellerPhone",
        seller.contact_telegram AS "sellerTelegram",
        seller.contact_instagram AS "sellerInstagram",
        seller.contact_vk AS "sellerVk"
      FROM orders o
      INNER JOIN products product ON product.id = o.product_id
      INNER JOIN users buyer ON buyer.id = o.buyer_user_id
      INNER JOIN users seller ON seller.id = o.seller_user_id
      WHERE ${where}
      ORDER BY o.created_at DESC
    `;
  }
}
