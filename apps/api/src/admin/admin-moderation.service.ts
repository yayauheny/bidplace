import {
  type AdminProductStatusUpdateRequest,
  type AdminSellerStatusUpdateRequest,
} from '@bidplace/contracts';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService, runSerializableTransaction } from '../core/database';
import { missingProductApprovalFields } from '../products/product-requirements';
import { sellerProfileAuthSelect } from '../sellers/seller-profile.mapper';

@Injectable()
export class AdminModerationService {
  private readonly logger = new Logger(AdminModerationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async updateSellerStatus(
    adminUserId: string,
    sellerProfileId: string,
    input: AdminSellerStatusUpdateRequest,
  ) {
    return runSerializableTransaction(this.prisma, async (tx) => {
      const sellerProfile = await tx.sellerProfile.findUnique({
        where: { id: sellerProfileId },
      });

      if (!sellerProfile) {
        this.logger.warn('Seller moderation target was not found');
        throw new NotFoundException('Seller profile not found');
      }

      if (!this.isAllowedSellerTransition(sellerProfile.status, input.status)) {
        this.logger.warn(
          `Blocked seller status transition target=${sellerProfile.id} from=${sellerProfile.status} to=${input.status}`,
        );
        throw new ConflictException('Seller profile transition is not allowed');
      }

      if (input.status === 'SUSPENDED') {
        const blockingListing = await tx.listing.findFirst({
          where: {
            status: { in: ['SCHEDULED', 'LIVE'] },
            product: { sellerProfileId: sellerProfile.id },
          },
          select: { id: true },
        });
        if (blockingListing) {
          this.logger.warn(
            `Blocked seller status transition target=${sellerProfile.id} from=${sellerProfile.status} to=${input.status} because a scheduled or live listing exists`,
          );
          throw new ConflictException(
            'Seller cannot be suspended while a scheduled or live listing exists',
          );
        }
      }

      if (input.status === 'APPROVED') {
        this.assertSellerApprovalRequirements(sellerProfile);
      }

      const updated = await tx.sellerProfile.update({
        where: { id: sellerProfileId },
        data: { status: input.status },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: adminUserId,
          targetType: 'SELLER_PROFILE',
          targetId: sellerProfile.id,
          oldStatus: sellerProfile.status,
          newStatus: input.status,
          reason: input.reason ?? null,
        },
      });

      return updated;
    });
  }

  async updateProductStatus(
    adminUserId: string,
    productId: string,
    input: AdminProductStatusUpdateRequest,
  ) {
    return runSerializableTransaction(this.prisma, async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        include: {
          sellerProfile: { select: sellerProfileAuthSelect },
          images: { select: { id: true } },
          listings: {
            where: { status: { in: ['SCHEDULED', 'LIVE'] } },
            select: { id: true },
          },
        },
      });

      if (!product) {
        this.logger.warn('Product moderation target was not found');
        throw new NotFoundException('Product not found');
      }

      if (!this.isAllowedProductTransition(product.status, input.status)) {
        this.logger.warn(
          `Blocked product status transition target=${product.id} from=${product.status} to=${input.status}`,
        );
        throw new ConflictException('Product transition is not allowed');
      }

      if (
        ['CHANGES_REQUESTED', 'ARCHIVED'].includes(input.status) &&
        product.listings.length > 0
      ) {
        this.logger.warn(
          `Blocked product status transition target=${product.id} from=${product.status} to=${input.status} because a scheduled or live listing exists`,
        );
        throw new ConflictException(
          'Product cannot be changed while a scheduled or live listing exists',
        );
      }

      if (input.status === 'APPROVED') {
        this.assertProductApprovalRequirements(product);

        if (product.sellerProfile.status !== 'APPROVED') {
          this.logger.warn(
            'Blocked product approval because seller is not approved',
          );
          throw new ConflictException('SellerProfile must be approved first');
        }
      }

      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          status: input.status,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: adminUserId,
          targetType: 'PRODUCT',
          targetId: product.id,
          oldStatus: product.status,
          newStatus: input.status,
          reason: input.reason ?? null,
        },
      });

      return updated;
    });
  }

  private isAllowedSellerTransition(current: string, next: string): boolean {
    const allowed: Record<string, ReadonlySet<string>> = {
      PENDING_REVIEW: new Set([
        'APPROVED',
        'CHANGES_REQUESTED',
        'REJECTED',
        'SUSPENDED',
      ]),
      CHANGES_REQUESTED: new Set(['APPROVED', 'REJECTED', 'SUSPENDED']),
      APPROVED: new Set(['CHANGES_REQUESTED', 'SUSPENDED']),
      REJECTED: new Set([
        'APPROVED',
        'CHANGES_REQUESTED',
        'REJECTED',
        'SUSPENDED',
      ]),
      SUSPENDED: new Set([
        'APPROVED',
        'CHANGES_REQUESTED',
        'REJECTED',
        'SUSPENDED',
      ]),
    };

    return allowed[current]?.has(next) ?? false;
  }

  private isAllowedProductTransition(current: string, next: string): boolean {
    const allowed: Record<string, ReadonlySet<string>> = {
      DRAFT: new Set(['PENDING_REVIEW']),
      PENDING_REVIEW: new Set(['APPROVED', 'CHANGES_REQUESTED', 'REJECTED']),
      CHANGES_REQUESTED: new Set(['PENDING_REVIEW', 'REJECTED']),
      APPROVED: new Set(['CHANGES_REQUESTED', 'ARCHIVED']),
      REJECTED: new Set([]),
      ARCHIVED: new Set([]),
    };

    return allowed[current]?.has(next) ?? false;
  }

  private assertSellerApprovalRequirements(sellerProfile: {
    fullName: string | null;
    socialLink: string | null;
    shortDescription: string | null;
    profilePhotoData: Uint8Array | null;
  }) {
    if (
      !sellerProfile.fullName ||
      !sellerProfile.socialLink ||
      !sellerProfile.shortDescription ||
      !sellerProfile.profilePhotoData ||
      sellerProfile.profilePhotoData.byteLength < 1
    ) {
      this.logger.warn(
        'Blocked seller approval because required fields are missing',
      );
      throw new ConflictException(
        'Seller profile does not meet approval requirements',
      );
    }
  }

  private assertProductApprovalRequirements(product: {
    title: string | null;
    story: string | null;
    categoryId: string | null;
    condition: string | null;
    uniqueness: string | null;
    provenance: string | null;
    city: string | null;
    packaging: string | null;
    deliveryInfo: string | null;
    images: Array<{ id: string }>;
  }) {
    if (missingProductApprovalFields(product).length > 0) {
      this.logger.warn(
        'Blocked product approval because required fields are missing',
      );
      throw new ConflictException(
        'Product does not meet approval requirements',
      );
    }
  }
}
