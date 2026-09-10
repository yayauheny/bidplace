import {
  type AdminProductStatusUpdateRequest,
  type AdminSellerStatusUpdateRequest,
  type SellerProfileRevisionStatus,
} from '@bidplace/contracts';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  PrismaService,
  runReadCommittedTransaction,
  runSerializableTransaction,
} from '../core/database';
import { missingProductApprovalFields } from '../products/product-requirements';
import { assertProductRevisionTransition } from '../products/product-revision-state';
import { lockProductRowForUpdate } from '../products/product-write-guard';
import {
  sellerProfileAuthSelect,
  sellerProfileResponseSelect,
} from '../sellers/seller-profile.mapper';
import { assertSellerProfileRevisionTransition } from '../sellers/seller-profile-revision-state';

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
        include: { editingRevision: true },
      });

      if (!sellerProfile) {
        this.logger.warn('Seller moderation target was not found');
        throw new NotFoundException('Seller profile not found');
      }

      const editingRevision = sellerProfile.editingRevision;
      const isRevisionReview =
        editingRevision?.status === 'PENDING_REVIEW' &&
        ['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'].includes(input.status);
      const isVisibilityTransition =
        (sellerProfile.status === 'APPROVED' &&
          input.status === 'SUSPENDED') ||
        (sellerProfile.status === 'SUSPENDED' && input.status === 'APPROVED');

      if (
        !isRevisionReview &&
        !isVisibilityTransition &&
        (editingRevision !== null ||
          !this.isAllowedSellerTransition(sellerProfile.status, input.status))
      ) {
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

      if (isRevisionReview) {
        const revisionStatus = input.status as SellerProfileRevisionStatus;
        assertSellerProfileRevisionTransition(
          'admin',
          editingRevision.status,
          revisionStatus,
        );
        const approvedPhoto =
          input.status === 'APPROVED'
            ? this.requiredApprovedSellerPhoto(editingRevision)
            : null;

        await tx.sellerProfileRevision.update({
          where: { id: editingRevision.id },
          data: { status: revisionStatus, reviewedAt: new Date() },
        });

        const updated =
          input.status === 'APPROVED' && approvedPhoto
            ? await tx.sellerProfile.update({
                where: { id: sellerProfileId },
                data: {
                  ...this.publishedSellerProfileData(editingRevision),
                  ...approvedPhoto,
                  status:
                    sellerProfile.status === 'PENDING_REVIEW'
                      ? 'APPROVED'
                      : sellerProfile.status,
                  publishedRevisionId: editingRevision.id,
                },
                select: sellerProfileResponseSelect,
              })
            : sellerProfile.status === 'PENDING_REVIEW'
              ? await tx.sellerProfile.update({
                  where: { id: sellerProfileId },
                  data: { status: input.status },
                  select: sellerProfileResponseSelect,
                })
              : await tx.sellerProfile.findUniqueOrThrow({
                  where: { id: sellerProfileId },
                  select: sellerProfileResponseSelect,
                });

        await tx.auditEvent.create({
          data: {
            actorUserId: adminUserId,
            targetType: 'SELLER_PROFILE',
            targetId: sellerProfile.id,
            oldStatus: editingRevision.status,
            newStatus: input.status,
            reason: input.reason ?? null,
          },
        });

        return updated;
      }

      if (input.status === 'APPROVED') {
        this.requiredApprovedSellerPhoto(sellerProfile);
      }

      const updated = await tx.sellerProfile.update({
        where: { id: sellerProfileId },
        data: { status: input.status },
        select: sellerProfileResponseSelect,
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
    return runReadCommittedTransaction(this.prisma, async (tx) => {
      await lockProductRowForUpdate(tx, productId);
      const product = await tx.product.findUnique({
        where: { id: productId },
        include: {
          sellerProfile: { select: sellerProfileAuthSelect },
          images: { select: { id: true } },
          editingRevision: {
            include: { images: { select: { imageId: true } } },
          },
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

      const editingRevision = product.editingRevision;
      const isRevisionReview =
        editingRevision?.status === 'PENDING_REVIEW' &&
        ['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'].includes(input.status);
      const isVisibilityTransition =
        (product.status === 'APPROVED' && input.status === 'ARCHIVED') ||
        (product.status === 'ARCHIVED' && input.status === 'APPROVED');

      if (!isRevisionReview && !isVisibilityTransition) {
        this.logger.warn(
          `Blocked product status transition target=${product.id} from=${product.status} to=${input.status}`,
        );
        throw new ConflictException('Product transition is not allowed');
      }

      if (isRevisionReview) {
        assertProductRevisionTransition(
          'admin',
          editingRevision.status,
          input.status,
        );

        if (input.status === 'APPROVED') {
          this.assertProductApprovalRequirements({
            ...editingRevision,
            images: editingRevision.images.map(({ imageId }) => ({
              id: imageId,
            })),
          });
          if (product.sellerProfile.status !== 'APPROVED') {
            this.logger.warn(
              'Blocked product approval because seller is not approved',
            );
            throw new ConflictException('SellerProfile must be approved first');
          }
        }

        await tx.productRevision.update({
          where: { id: editingRevision.id },
          data: { status: input.status, reviewedAt: new Date() },
        });
        const updated =
          input.status === 'APPROVED'
            ? await tx.product.update({
                where: { id: productId },
                data: {
                  ...this.publishedProductData(editingRevision),
                  status:
                    product.status === 'ARCHIVED' ? 'ARCHIVED' : 'APPROVED',
                  publishedRevisionId: editingRevision.id,
                  publishedAt: product.publishedAt ?? new Date(),
                },
              })
            : product.status === 'PENDING_REVIEW'
              ? await tx.product.update({
                  where: { id: productId },
                  data: { status: input.status },
                })
              : product;

        await tx.auditEvent.create({
          data: {
            actorUserId: adminUserId,
            targetType: 'PRODUCT',
            targetId: product.id,
            oldStatus: editingRevision.status,
            newStatus: input.status,
            reason: input.reason ?? null,
          },
        });
        return updated;
      }

      assertProductRevisionTransition('admin', product.status, input.status);
      const updated = await tx.product.update({
        where: { id: productId },
        data: { status: input.status },
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

  private publishedProductData(revision: {
    categoryId: string | null;
    title: string | null;
    story: string | null;
    technique: string | null;
    materials: string | null;
    dimensions: string | null;
    weight: string | null;
    year: number | null;
    condition: string | null;
    uniqueness: string | null;
    provenance: string | null;
    city: string | null;
    packaging: string | null;
    deliveryInfo: string | null;
    creationIntro: string | null;
  }) {
    return {
      categoryId: revision.categoryId,
      title: revision.title,
      story: revision.story,
      technique: revision.technique,
      materials: revision.materials,
      dimensions: revision.dimensions,
      weight: revision.weight,
      year: revision.year,
      condition: revision.condition,
      uniqueness: revision.uniqueness,
      provenance: revision.provenance,
      city: revision.city,
      packaging: revision.packaging,
      deliveryInfo: revision.deliveryInfo,
      creationIntro: revision.creationIntro,
    };
  }

  private publishedSellerProfileData(revision: {
    slug: string;
    discipline: string;
    fullName: string;
    country: string;
    city: string | null;
    practice: string | null;
    socialLink: string | null;
    telegramUrl: string | null;
    instagramUrl: string | null;
    websiteUrl: string | null;
    shortDescription: string;
  }) {
    return {
      slug: revision.slug,
      discipline: revision.discipline,
      fullName: revision.fullName,
      country: revision.country,
      city: revision.city,
      practice: revision.practice,
      socialLink: revision.socialLink,
      telegramUrl: revision.telegramUrl,
      instagramUrl: revision.instagramUrl,
      websiteUrl: revision.websiteUrl,
      shortDescription: revision.shortDescription,
    };
  }

  private requiredApprovedSellerPhoto(sellerProfile: {
    fullName: string | null;
    city: string | null;
    socialLink: string | null;
    shortDescription: string | null;
    profilePhotoMimeType?: string | null;
    profilePhotoByteLength?: number | null;
    profilePhotoChecksum?: string | null;
    profilePhotoObjectKey?: string | null;
  }) {
    const profilePhotoMimeType = sellerProfile.profilePhotoMimeType ?? null;
    const profilePhotoByteLength = sellerProfile.profilePhotoByteLength ?? null;
    const profilePhotoChecksum = sellerProfile.profilePhotoChecksum ?? null;
    const profilePhotoObjectKey = sellerProfile.profilePhotoObjectKey ?? null;
    if (
      !sellerProfile.fullName ||
      !sellerProfile.city ||
      !sellerProfile.shortDescription ||
      !profilePhotoMimeType ||
      !profilePhotoByteLength ||
      !profilePhotoChecksum ||
      !profilePhotoObjectKey
    ) {
      this.logger.warn(
        'Blocked seller approval because required fields are missing',
      );
      throw new ConflictException(
        'Seller profile does not meet approval requirements',
      );
    }

    return {
      profilePhotoMimeType,
      profilePhotoByteLength,
      profilePhotoChecksum,
      profilePhotoObjectKey,
    };
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
