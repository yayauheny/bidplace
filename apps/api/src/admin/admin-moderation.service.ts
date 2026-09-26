import {
  type AdminProductStatusUpdateRequest,
  type AdminSellerStatusUpdateRequest,
  adminProductsResponseSchema,
  adminSellerProfilesResponseSchema,
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
import {
  productSelect,
  toContractProduct,
  toProductResponse,
} from '../products/products.mapper';
import { missingProductApprovalFields } from '../products/product-requirements';
import { assertProductRevisionTransition } from '../products/product-revision-state';
import { lockProductRowForUpdate } from '../products/product-write-guard';
import {
  sellerProfileAuthSelect,
  sellerProfileResponseSelect,
  toSellerProfileResponse,
} from '../sellers/seller-profile.mapper';
import { assertSellerProfileRevisionTransition } from '../sellers/seller-profile-revision-state';

const adminProductSelect = {
  ...productSelect,
  creationIntro: true,
  creationSteps: {
    orderBy: { position: 'asc' },
    select: {
      id: true,
      position: true,
      title: true,
      body: true,
      mimeType: true,
      byteLength: true,
      checksum: true,
      width: true,
      height: true,
    },
  },
  sellerProfile: { select: { slug: true, fullName: true, status: true } },
  listings: {
    where: { status: { in: ['SCHEDULED', 'LIVE'] } },
    select: { status: true },
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
} satisfies import('@bidplace/database').Prisma.ProductSelect;

@Injectable()
export class AdminModerationService {
  private readonly logger = new Logger(AdminModerationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listSellerProfiles() {
    const sellerProfiles = await this.prisma.sellerProfile.findMany({
      where: { status: { not: 'DRAFT' } },
      select: sellerProfileResponseSelect,
      orderBy: { createdAt: 'asc' },
    });
    const ids = sellerProfiles.map(({ id }) => id);
    const [blockingSellers, reasons] = await Promise.all([
      this.prisma.sellerProfile.findMany({
        where: {
          id: { in: ids },
          products: {
            some: {
              listings: { some: { status: { in: ['SCHEDULED', 'LIVE'] } } },
            },
          },
        },
        select: { id: true },
      }),
      this.latestModerationReasons('SELLER_PROFILE', ids),
    ]);
    const blockingSellerIds = new Set(blockingSellers.map(({ id }) => id));

    return adminSellerProfilesResponseSchema.parse({
      sellerProfiles: sellerProfiles.map((sellerProfile) => ({
        ...toSellerProfileResponse(sellerProfile).sellerProfile,
        lastModerationReason: reasons.get(sellerProfile.id) ?? null,
        hasBlockingListing: blockingSellerIds.has(sellerProfile.id),
      })),
    });
  }

  async listProducts() {
    const products = await this.prisma.product.findMany({
      select: adminProductSelect,
      orderBy: { createdAt: 'asc' },
    });
    const reasons = await this.latestModerationReasons(
      'PRODUCT',
      products.map(({ id }) => id),
    );

    return adminProductsResponseSchema.parse({
      products: products.map((product) => ({
        ...toContractProduct(product),
        sellerProfile: product.sellerProfile,
        creationIntro: product.creationIntro ?? null,
        creationSteps: product.creationSteps.map((step) => ({
          id: step.id,
          position: step.position,
          title: step.title,
          body: step.body,
          image:
            step.mimeType && step.byteLength && step.checksum
              ? {
                  url: `/api/creation-steps/${step.id}/image`,
                  mimeType: step.mimeType,
                  byteLength: step.byteLength,
                  checksum: step.checksum,
                  width: step.width,
                  height: step.height,
                }
              : null,
        })),
        hasBlockingListing: product.listings.length > 0,
        lastModerationReason: reasons.get(product.id) ?? null,
      })),
    });
  }

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
            ? this.requiredApprovedSellerPhoto({
                ...editingRevision,
                profilePhotoMimeType:
                  editingRevision.profilePhotoMimeType ??
                  sellerProfile.profilePhotoMimeType,
                profilePhotoByteLength:
                  editingRevision.profilePhotoByteLength ??
                  sellerProfile.profilePhotoByteLength,
                profilePhotoChecksum:
                  editingRevision.profilePhotoChecksum ??
                  sellerProfile.profilePhotoChecksum,
                profilePhotoObjectKey:
                  editingRevision.profilePhotoObjectKey ??
                  sellerProfile.profilePhotoObjectKey,
                profilePhotoData: sellerProfile.profilePhotoData,
              })
            : null;

        await tx.sellerProfileRevision.update({
          where: { id: editingRevision.id },
          data: { status: revisionStatus, reviewedAt: new Date() },
        });

        const updated =
          input.status === 'APPROVED'
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
        this.assertSellerApprovalRequirements(sellerProfile);
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

  async updateProductStatusAndReadback(
    adminUserId: string,
    productId: string,
    input: AdminProductStatusUpdateRequest,
  ) {
    const product = await this.updateProductStatus(adminUserId, productId, input);
    return toProductResponse(
      await this.prisma.product.findUniqueOrThrow({
        where: { id: product.id },
        select: productSelect,
      }),
    );
  }

  private async latestModerationReasons(
    targetType: 'SELLER_PROFILE' | 'PRODUCT',
    targetIds: string[],
  ) {
    const auditEvents = await this.prisma.auditEvent.findMany({
      where: {
        targetType,
        targetId: { in: targetIds },
        reason: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      select: { targetId: true, reason: true },
    });
    const reasons = new Map<string, string>();
    for (const event of auditEvents) {
      if (event.reason && !reasons.has(event.targetId)) {
        reasons.set(event.targetId, event.reason);
      }
    }
    return reasons;
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
    discipline: string | null;
    fullName: string;
    country: string;
    city: string | null;
    practice: string | null;
    biography: string | null;
    socialLink: string | null;
    telegramUrl: string | null;
    instagramUrl: string | null;
    websiteUrl: string | null;
    publicEmail: string | null;
    shortDescription: string | null;
  }) {
    return {
      slug: revision.slug,
      discipline: revision.discipline,
      fullName: revision.fullName,
      country: revision.country,
      city: revision.city,
      practice: revision.practice,
      biography: revision.biography,
      socialLink: revision.socialLink,
      telegramUrl: revision.telegramUrl,
      instagramUrl: revision.instagramUrl,
      websiteUrl: revision.websiteUrl,
      publicEmail: revision.publicEmail,
      shortDescription: revision.shortDescription,
    };
  }

  private requiredApprovedSellerPhoto(sellerProfile: {
    fullName: string | null;
    city: string | null;
    shortDescription: string | null;
    profilePhotoMimeType?: string | null;
    profilePhotoByteLength?: number | null;
    profilePhotoChecksum?: string | null;
    profilePhotoObjectKey?: string | null;
    profilePhotoData?: Uint8Array | null;
  }) {
    const profilePhotoMimeType = sellerProfile.profilePhotoMimeType ?? null;
    const profilePhotoByteLength = sellerProfile.profilePhotoByteLength ?? null;
    const profilePhotoChecksum = sellerProfile.profilePhotoChecksum ?? null;
    const profilePhotoObjectKey = sellerProfile.profilePhotoObjectKey ?? null;
    const hasRevisionPhoto = Boolean(
      profilePhotoMimeType &&
        profilePhotoByteLength &&
        profilePhotoChecksum &&
        profilePhotoObjectKey,
    );
    const hasLegacyPhoto = Boolean(sellerProfile.profilePhotoData?.byteLength);
    if (
      !sellerProfile.fullName ||
      !sellerProfile.city ||
      !sellerProfile.shortDescription ||
      (!hasRevisionPhoto && !hasLegacyPhoto)
    ) {
      this.logger.warn(
        'Blocked seller approval because required fields are missing',
      );
      throw new ConflictException(
        'Seller profile does not meet approval requirements',
      );
    }

    if (
      profilePhotoMimeType &&
      profilePhotoByteLength &&
      profilePhotoChecksum &&
      profilePhotoObjectKey
    ) {
      return {
        profilePhotoMimeType,
        profilePhotoByteLength,
        profilePhotoChecksum,
        profilePhotoObjectKey,
      };
    }

    return {};
  }

  private assertSellerApprovalRequirements(sellerProfile: {
    fullName: string | null;
    city: string | null;
    shortDescription: string | null;
    profilePhotoData: Uint8Array | null;
    profilePhotoMimeType?: string | null;
    profilePhotoByteLength?: number | null;
    profilePhotoChecksum?: string | null;
    profilePhotoObjectKey?: string | null;
  }) {
    this.requiredApprovedSellerPhoto(sellerProfile);
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
