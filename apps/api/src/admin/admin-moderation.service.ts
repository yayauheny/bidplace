import {
  moderationSummarySql,
  type ModerationResource,
  type ModerationSummaryRow,
} from './admin-moderation-summary';
import {
  publishedProductData,
  publishedSellerProfileData,
} from '../core/media/publication-fields';
import { createHash } from 'node:crypto';

import {
  adminHistoryResponseSchema,
  adminModerationSummariesSchema,
  adminProductDetailSchema,
  adminSellerDetailSchema,
  encodeAdminQueueCursor,
  type AdminQueueQuery,
  type AdminModerationCursor,
  type AdminModerationListQuery,
  type AdminProductStatusUpdateRequest,
  type AdminSellerStatusUpdateRequest,
  adminProductsResponseSchema,
  adminSellerProfilesResponseSchema,
  type SellerProfileRevisionStatus,
} from '@bidplace/contracts';
import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  PrismaService,
  runReadCommittedTransaction,
  runSerializableTransaction,
} from '../core/database';
import { MediaLifecycleService } from '../core/media/media-lifecycle.service';
import { ImageStore } from '../core/image-store';
import { productSelect, toProductResponse } from '../products/products.mapper';
import { missingProductApprovalFields } from '../products/product-requirements';
import {
  selectedPendingProposalCount,
  writeTermLabel,
} from '../products/work-selection';
import { assertProductRevisionTransition } from '../products/product-revision-state';
import { lockProductRowForUpdate } from '../products/product-write-guard';
import {
  sellerProfileAuthSelect,
  sellerProfileResponseSelect,
} from '../sellers/seller-profile.mapper';
import { assertSellerProfileRevisionTransition } from '../sellers/seller-profile-revision-state';
import {
  latestModerationReasonSql,
  moderationListOrderBy,
  moderationKeysetWhere,
  moderationPage,
  orderRowsByIds,
  productModerationSearchSql,
  productModerationWhere,
  readModerationCursor,
  sellerModerationSearchSql,
  sellerModerationWhere,
} from './admin-moderation-list';
import {
  adminProductSummarySelect,
  adminSellerSummarySelect,
  toProductSummaryCard,
  toSellerSummaryCard,
  adminProductListSelect,
  adminSellerListSelect,
  adminSellerRevisionSelect,
  selectSellerRevisionPhotoSource,
  toAdminProduct,
  toAdminSellerProfile,
} from './admin-moderation.mapper';

@Injectable()
export class AdminModerationService {
  private readonly logger = new Logger(AdminModerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly imageStore: ImageStore,
    @Inject(MediaLifecycleService)
    private readonly media?: MediaLifecycleService,
  ) {}

  async summaries(resource: ModerationResource, query: AdminQueueQuery) {
    return this.prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<ModerationSummaryRow[]>(
      moderationSummarySql(resource, query),
    );
    const page = rows.slice(0, query.limit);
    const last = page.at(-1);
    const cards = new Map<string, unknown>();
    if (query.includeCard && page.length) {
      const where = { id: { in: page.map((row) => row.id) } };
      if (resource === 'PRODUCT') {
        for (const record of await tx.product.findMany({ where, select: adminProductSummarySelect })) cards.set(record.id, toProductSummaryCard(record));
      } else {
        for (const record of await tx.sellerProfile.findMany({ where, select: adminSellerSummarySelect })) cards.set(record.id, toSellerSummaryCard(record));
      }
    }
    return adminModerationSummariesSchema.parse({
      items: page.map((row) => ({
        ...(query.includeCard ? { card: cards.get(row.id) } : {}),
        id: row.id, label: row.label, parentStatus: row.parentStatus,
        reviewStatus: row.reviewStatus, reviewRevisionId: row.reviewRevisionId,
        submittedAt: row.submittedAt?.toISOString() ?? null,
        submissionTimeUnknown: row.submittedAt === null,
      })),
      nextCursor:
        rows.length > query.limit && last
          ? encodeAdminQueueCursor({
              submittedAt: last.submittedAt?.toISOString() ?? null,
              id: last.sortId,
            })
          : null,
    });
    }, { isolationLevel: 'RepeatableRead' });
  }

  async sellerDetail(id: string) {
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { id },
      select: {
        ...adminSellerListSelect,
        publishedRevision: { select: adminSellerRevisionSelect },
        products: {
          where: {
            listings: { some: { status: { in: ['SCHEDULED', 'LIVE'] } } },
          },
          select: { id: true },
          take: 1,
        },
      },
    });
    if (!seller) throw new NotFoundException('Seller profile not found');
    const reasons = await this.latestModerationReasons('SELLER_PROFILE', [id]);
    const entity = toAdminSellerProfile(
      seller,
      reasons.get(id) ?? null,
      seller.products.length > 0,
    );
    const revision = entity.reviewTarget;
    return adminSellerDetailSchema.parse({
      entity,
      reviewRevision: revision,
      publishedRevision: seller.publishedRevision
        ? toAdminSellerProfile(
            { ...seller, editingRevision: seller.publishedRevision },
            null,
            false,
            true,
          ).reviewTarget
        : null,
      decisionTarget:
        revision?.status === 'PENDING_REVIEW'
          ? { kind: 'revision', id: revision.id, updatedAt: revision.updatedAt }
          : {
              kind: 'parent',
              status: seller.status,
              updatedAt: seller.updatedAt.toISOString(),
            },
    });
  }

  async productDetail(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        ...adminProductListSelect,
        publishedRevision: {
          select: adminProductListSelect.editingRevision.select,
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    const reasons = await this.latestModerationReasons('PRODUCT', [id]);
    const entity = toAdminProduct(product, reasons.get(id) ?? null);
    const revision = entity.reviewTarget;
    return adminProductDetailSchema.parse({
      entity,
      reviewRevision: revision,
      publishedRevision: product.publishedRevision
        ? toAdminProduct(
            { ...product, editingRevision: product.publishedRevision },
            null,
          ).reviewTarget
        : null,
      decisionTarget:
        revision?.status === 'PENDING_REVIEW'
          ? { kind: 'revision', id: revision.id, updatedAt: revision.updatedAt }
          : {
              kind: 'parent',
              status: product.status,
              updatedAt: product.updatedAt.toISOString(),
            },
    });
  }

  async history(
    resource: ModerationResource,
    id: string,
    query: { cursor?: string | undefined; limit: number },
  ) {
    const cursor = readModerationCursor(query.cursor);
    const rows = await this.prisma.auditEvent.findMany({
      where: {
        targetType: resource,
        targetId: id,
        ...moderationKeysetWhere(cursor),
      },
      orderBy: moderationListOrderBy,
      take: query.limit + 1,
      select: {
        id: true,
        createdAt: true,
        actorUserId: true,
        action: true,
        revisionId: true,
        mediaOperationId: true,
        operationGeneration: true,
        oldStatus: true,
        newStatus: true,
        reason: true,
      },
    });
    const { page, nextCursor } = moderationPage(rows, query.limit);
    return adminHistoryResponseSchema.parse({
      events: page.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
      nextCursor,
    });
  }

  async listSellerProfiles(query: AdminModerationListQuery) {
    const cursor = readModerationCursor(query.cursor);
    const { page, nextCursor } = await this.loadSellerPage(query, cursor);
    const ids = page.map(({ id }) => id);
    const [blockingSellers, reasons] = await Promise.all([
      ids.length === 0
        ? Promise.resolve([])
        : this.prisma.sellerProfile.findMany({
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
      sellerProfiles: page.map((sellerProfile) =>
        toAdminSellerProfile(
          sellerProfile,
          reasons.get(sellerProfile.id) ?? null,
          blockingSellerIds.has(sellerProfile.id),
        ),
      ),
      nextCursor,
    });
  }

  async listProducts(query: AdminModerationListQuery) {
    const cursor = readModerationCursor(query.cursor);
    const { page, nextCursor } = await this.loadProductPage(query, cursor);
    const reasons = await this.latestModerationReasons(
      'PRODUCT',
      page.map(({ id }) => id),
    );

    return adminProductsResponseSchema.parse({
      products: page.map((product) =>
        toAdminProduct(product, reasons.get(product.id) ?? null),
      ),
      nextCursor,
    });
  }

  private async loadSellerPage(
    query: AdminModerationListQuery,
    cursor: AdminModerationCursor | null,
  ) {
    if (!query.search) {
      const rows = await this.prisma.sellerProfile.findMany({
        where: sellerModerationWhere(query, cursor),
        select: adminSellerListSelect,
        orderBy: moderationListOrderBy,
        take: query.limit + 1,
      });
      return moderationPage(rows, query.limit);
    }
    const idRows = await this.prisma.$queryRaw<
      Array<{ id: string; created_at: Date | string }>
    >(sellerModerationSearchSql(query.search, query, cursor));
    return this.hydrateModerationPage(idRows, query.limit, (ids) =>
      this.prisma.sellerProfile.findMany({
        where: { id: { in: ids } },
        select: adminSellerListSelect,
      }),
    );
  }

  private async loadProductPage(
    query: AdminModerationListQuery,
    cursor: AdminModerationCursor | null,
  ) {
    if (!query.search) {
      const rows = await this.prisma.product.findMany({
        where: productModerationWhere(query, cursor),
        select: adminProductListSelect,
        orderBy: moderationListOrderBy,
        take: query.limit + 1,
      });
      return moderationPage(rows, query.limit);
    }
    const idRows = await this.prisma.$queryRaw<
      Array<{ id: string; created_at: Date | string }>
    >(productModerationSearchSql(query.search, query, cursor));
    return this.hydrateModerationPage(idRows, query.limit, (ids) =>
      this.prisma.product.findMany({
        where: { id: { in: ids } },
        select: adminProductListSelect,
      }),
    );
  }

  private async hydrateModerationPage<
    T extends { id: string; createdAt: Date },
  >(
    idRows: Array<{ id: string; created_at: Date | string }>,
    limit: number,
    load: (ids: string[]) => Promise<T[]>,
  ) {
    const bounded = moderationPage(
      idRows.map((row) => ({
        id: row.id,
        createdAt:
          row.created_at instanceof Date
            ? row.created_at
            : new Date(row.created_at),
      })),
      limit,
    );
    if (bounded.page.length === 0) {
      return { page: [] as T[], nextCursor: null };
    }
    const rows = await load(bounded.page.map((row) => row.id));
    return {
      page: orderRowsByIds(
        bounded.page.map((row) => row.id),
        rows,
      ),
      nextCursor: bounded.nextCursor,
    };
  }

  async getSellerRevisionPhoto(profileId: string, revisionId: string) {
    const revision = await this.prisma.sellerProfileRevision.findFirst({
      where: { id: revisionId, sellerProfileId: profileId },
      select: {
        ...adminSellerRevisionSelect,
        sellerProfile: {
          select: {
            id: true,
            profilePhotoMimeType: true,
            profilePhotoByteLength: true,
            profilePhotoChecksum: true,
            profilePhotoObjectKey: true,
          },
        },
      },
    });
    if (!revision) {
      throw new NotFoundException('Seller revision photo not found');
    }
    const source = selectSellerRevisionPhotoSource(
      revision,
      revision.sellerProfile,
    );
    if (!source) {
      throw new NotFoundException('Seller revision photo not found');
    }
    const stored = await this.imageStore.get(source.objectKey);
    const checksum = stored
      ? createHash('sha256').update(stored.bytes).digest('hex')
      : null;
    if (
      !stored ||
      stored.mimeType !== source.mimeType ||
      stored.bytes.byteLength !== source.byteLength ||
      checksum !== source.checksum
    ) {
      throw new NotFoundException('Seller revision photo not found');
    }
    return { mimeType: source.mimeType, bytes: stored.bytes };
  }

  async updateSellerStatus(
    adminUserId: string,
    sellerProfileId: string,
    input: AdminSellerStatusUpdateRequest,
  ) {
    let deliveryId: string | undefined;
    const sellerProfile = await runSerializableTransaction(
      this.prisma,
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM seller_profiles WHERE id = ${sellerProfileId}::uuid FOR UPDATE`;
        const sellerProfile = await tx.sellerProfile.findUnique({
          where: { id: sellerProfileId },
          include: { editingRevision: true },
        });

        if (!sellerProfile) {
          this.logger.warn('Seller moderation target was not found');
          throw new NotFoundException('Seller profile not found');
        }

        const editingRevision = sellerProfile.editingRevision;
        const isRevisionReview = input.target.kind === 'revision';
        const isVisibilityTransition =
          (sellerProfile.status === 'APPROVED' &&
            input.status === 'SUSPENDED') ||
          (sellerProfile.status === 'SUSPENDED' && input.status === 'APPROVED');
        if (
          this.media?.enabled &&
          sellerProfile.status === 'APPROVED' &&
          input.status === 'APPROVED' &&
          input.target.kind === 'revision' &&
          sellerProfile.publishedRevisionId === input.target.id
        ) {
          const delivered = await tx.mediaOperation.findUnique({
            where: {
              identity: `publish:${input.target.id}:${new Date(input.target.updatedAt).toISOString()}`,
            },
            select: { profileId: true, state: true },
          });
          if (
            delivered?.profileId === sellerProfileId &&
            delivered.state === 'DONE'
          )
            return tx.sellerProfile.findUniqueOrThrow({
              where: { id: sellerProfileId },
              select: sellerProfileResponseSelect,
            });
        }
        this.assertFreshSellerTarget(sellerProfile, input);

        if (
          !isRevisionReview &&
          !isVisibilityTransition &&
          (editingRevision !== null ||
            !this.isAllowedSellerTransition(sellerProfile.status, input.status))
        ) {
          this.logger.warn(
            `Blocked seller status transition target=${sellerProfile.id} from=${sellerProfile.status} to=${input.status}`,
          );
          throw new ConflictException(
            'Seller profile transition is not allowed',
          );
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
          if (!editingRevision) {
            throw new ConflictException('Moderation target is stale');
          }
          const revisionStatus = input.status as SellerProfileRevisionStatus;
          assertSellerProfileRevisionTransition(
            'admin',
            editingRevision.status,
            revisionStatus,
          );
          if (input.status === 'APPROVED') {
            const directionCount = await tx.sellerProfileRevisionDirection.count({
              where: { revisionId: editingRevision.id },
            });
            if (directionCount < 1) {
              throw new ConflictException(
                'Seller profile does not meet approval requirements',
              );
            }
          }
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

          if (input.status === 'APPROVED' && this.media?.enabled) {
            const operation = await this.media.enqueuePublication(
              tx,
              { profileId: sellerProfileId },
              editingRevision,
              sellerProfile.publishedRevisionId,
              adminUserId,
              false,
              input.reason ?? null,
            );
            deliveryId = operation.id;
            return tx.sellerProfile.findUniqueOrThrow({
              where: { id: sellerProfileId },
              select: sellerProfileResponseSelect,
            });
          }
          if (this.media?.enabled)
            await this.media.cancelPublication(tx, {
              profileId: sellerProfileId,
            });
          await tx.sellerProfileRevision.update({
            where: { id: editingRevision.id },
            data: { status: revisionStatus, reviewedAt: new Date() },
          });

          const updated =
            input.status === 'APPROVED'
              ? await tx.sellerProfile.update({
                  where: { id: sellerProfileId },
                  data: {
                    ...publishedSellerProfileData(editingRevision),
                    firstPublishedAt:
                      sellerProfile.firstPublishedAt ??
                      (sellerProfile.publishedRevisionId === null &&
                      sellerProfile.status === 'PENDING_REVIEW'
                        ? new Date()
                        : null),
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
              action: 'DECISION',
              revisionId: editingRevision.id,
              oldStatus: editingRevision.status,
              newStatus: input.status,
              reason: input.reason ?? null,
            },
          });

          if (input.status === 'APPROVED') {
            await tx.auditEvent.create({
              data: {
                actorUserId: adminUserId,
                targetType: 'SELLER_PROFILE',
                targetId: sellerProfile.id,
                action: 'PUBLICATION_COMPLETED',
                revisionId: editingRevision.id,
                newStatus: 'APPROVED',
              },
            });
          }

          return updated;
        }

        if (this.media?.enabled && input.status === 'SUSPENDED')
          await this.media.enqueueRevoke(tx, { profileId: sellerProfileId });
        if (input.status === 'APPROVED' && !isVisibilityTransition) {
          const revisionId =
            sellerProfile.publishedRevisionId ??
            sellerProfile.editingRevision?.id ??
            null;
          const directionCount = revisionId
            ? await tx.sellerProfileRevisionDirection.count({
                where: { revisionId },
              })
            : 0;
          if (directionCount < 1) {
            throw new ConflictException(
              'Seller profile does not meet approval requirements',
            );
          }
          this.assertSellerApprovalRequirements(sellerProfile);
        }
        if (input.status === 'APPROVED') {
          if (this.media?.enabled && sellerProfile.publishedRevisionId) {
            const revision = await tx.sellerProfileRevision.findUniqueOrThrow({
              where: { id: sellerProfile.publishedRevisionId },
            });
            const operation = await this.media.enqueuePublication(
              tx,
              { profileId: sellerProfileId },
              revision,
              sellerProfile.publishedRevisionId,
              adminUserId,
              true,
              input.reason ?? null,
            );
            deliveryId = operation.id;
            return tx.sellerProfile.findUniqueOrThrow({
              where: { id: sellerProfileId },
              select: sellerProfileResponseSelect,
            });
          }
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
            action: 'DECISION',
            revisionId: sellerProfile.publishedRevisionId,
            oldStatus: sellerProfile.status,
            newStatus: input.status,
            reason: input.reason ?? null,
          },
        });
        if (input.status === 'APPROVED') {
          await tx.auditEvent.create({ data: {
            actorUserId: adminUserId, targetType: 'SELLER_PROFILE', targetId: sellerProfile.id,
            action: 'PUBLICATION_COMPLETED', revisionId: sellerProfile.publishedRevisionId,
            oldStatus: sellerProfile.status, newStatus: 'APPROVED',
          } });
        }

        return updated;
      },
    );
    if (this.media?.enabled) {
      try {
        if (deliveryId) await this.media.deliver(deliveryId);
      } finally {
        await this.media.deliverOutstanding(
          { profileId: sellerProfileId },
          'REVOKE',
        );
      }
      if (deliveryId)
        return this.prisma.sellerProfile.findUniqueOrThrow({
          where: { id: sellerProfileId },
          select: sellerProfileResponseSelect,
        });
    }
    return sellerProfile;
  }

  async updateProductStatus(
    adminUserId: string,
    productId: string,
    input: AdminProductStatusUpdateRequest,
  ) {
    let deliveryId: string | undefined;
    const product = await runReadCommittedTransaction(
      this.prisma,
      async (tx) => {
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
        const isRevisionReview = input.target.kind === 'revision';
        const isVisibilityTransition =
          (product.status === 'APPROVED' && input.status === 'ARCHIVED') ||
          (product.status === 'ARCHIVED' && input.status === 'APPROVED');
        if (
          this.media?.enabled &&
          product.status === 'APPROVED' &&
          input.status === 'APPROVED' &&
          input.target.kind === 'revision' &&
          product.publishedRevisionId === input.target.id
        ) {
          const delivered = await tx.mediaOperation.findUnique({
            where: {
              identity: `publish:${input.target.id}:${new Date(input.target.updatedAt).toISOString()}`,
            },
            select: { productId: true, state: true },
          });
          if (delivered?.productId === productId && delivered.state === 'DONE')
            return product;
        }
        this.assertFreshProductTarget(product, input);

        if (!isRevisionReview && !isVisibilityTransition) {
          this.logger.warn(
            `Blocked product status transition target=${product.id} from=${product.status} to=${input.status}`,
          );
          throw new ConflictException('Product transition is not allowed');
        }

        if (isRevisionReview) {
          if (!editingRevision) {
            throw new ConflictException('Moderation target is stale');
          }
          assertProductRevisionTransition(
            'admin',
            editingRevision.status,
            input.status,
          );

          if (input.status === 'APPROVED') {
            if (
              (await selectedPendingProposalCount(tx, editingRevision.id)) > 0
            ) {
              throw new ConflictException(
                'Selected catalog proposals must be resolved before approval',
              );
            }
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
              throw new ConflictException(
                'SellerProfile must be approved first',
              );
            }
          }

          if (input.status === 'APPROVED' && this.media?.enabled) {
            const operation = await this.media.enqueuePublication(
              tx,
              { productId },
              editingRevision,
              product.publishedRevisionId,
              adminUserId,
              false,
              input.reason ?? null,
            );
            deliveryId = operation.id;
            return product;
          }
          if (this.media?.enabled)
            await this.media.cancelPublication(tx, { productId });
          await tx.productRevision.update({
            where: { id: editingRevision.id },
            data: { status: input.status, reviewedAt: new Date() },
          });
          const updated =
            input.status === 'APPROVED'
              ? await tx.product.update({
                  where: { id: productId },
                  data: {
                    ...publishedProductData(editingRevision),
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
              action: 'DECISION',
              revisionId: editingRevision.id,
              oldStatus: editingRevision.status,
              newStatus: input.status,
              reason: input.reason ?? null,
            },
          });
          if (input.status === 'APPROVED') {
            await tx.auditEvent.create({
              data: {
                actorUserId: adminUserId,
                targetType: 'PRODUCT',
                targetId: product.id,
                action: 'PUBLICATION_COMPLETED',
                revisionId: editingRevision.id,
                newStatus: 'APPROVED',
              },
            });
          }
          return updated;
        }

        if (this.media?.enabled && input.status === 'ARCHIVED')
          await this.media.enqueueRevoke(tx, { productId });
        assertProductRevisionTransition('admin', product.status, input.status);
        if (
          input.status === 'APPROVED' &&
          this.media?.enabled &&
          product.publishedRevisionId
        ) {
          const revision = await tx.productRevision.findUniqueOrThrow({
            where: { id: product.publishedRevisionId },
          });
          const operation = await this.media.enqueuePublication(
            tx,
            { productId },
            revision,
            product.publishedRevisionId,
            adminUserId,
            true,
            input.reason ?? null,
          );
          deliveryId = operation.id;
          return product;
        }
        const updated = await tx.product.update({
          where: { id: productId },
          data: { status: input.status },
        });

        await tx.auditEvent.create({
          data: {
            actorUserId: adminUserId,
            targetType: 'PRODUCT',
            targetId: product.id,
            action: 'DECISION',
            revisionId: product.publishedRevisionId,
            oldStatus: product.status,
            newStatus: input.status,
            reason: input.reason ?? null,
          },
        });
        if (input.status === 'APPROVED') {
          await tx.auditEvent.create({ data: {
            actorUserId: adminUserId, targetType: 'PRODUCT', targetId: product.id,
            action: 'PUBLICATION_COMPLETED', revisionId: product.publishedRevisionId,
            oldStatus: product.status, newStatus: 'APPROVED',
          } });
        }

        return updated;
      },
    );
    if (this.media?.enabled) {
      try {
        if (deliveryId) await this.media.deliver(deliveryId);
      } finally {
        await this.media.deliverOutstanding({ productId }, 'REVOKE');
      }
    }
    return product;
  }

  async updateProductStatusAndReadback(
    adminUserId: string,
    productId: string,
    input: AdminProductStatusUpdateRequest,
  ) {
    const product = await this.updateProductStatus(
      adminUserId,
      productId,
      input,
    );
    return toProductResponse(
      await this.prisma.product.findUniqueOrThrow({
        where: { id: product.id },
        select: productSelect,
      }),
    );
  }

  private assertFreshSellerTarget(
    sellerProfile: {
      status: string;
      updatedAt: Date;
      editingRevision: { id: string; status: string; updatedAt: Date } | null;
    },
    input: AdminSellerStatusUpdateRequest,
  ) {
    if (input.target.kind === 'revision') {
      const revision = sellerProfile.editingRevision;
      if (
        !revision ||
        revision.id !== input.target.id ||
        !this.sameInstant(revision.updatedAt, input.target.updatedAt) ||
        revision.status !== 'PENDING_REVIEW' ||
        !['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'].includes(input.status)
      ) {
        this.logger.warn(
          `Blocked stale seller revision target=${sellerProfile.editingRevision?.id ?? 'none'}`,
        );
        throw new ConflictException('Moderation target is stale');
      }
      return;
    }

    if (
      sellerProfile.status !== input.target.status ||
      !this.sameInstant(sellerProfile.updatedAt, input.target.updatedAt)
    ) {
      this.logger.warn('Blocked stale seller parent target');
      throw new ConflictException('Moderation target is stale');
    }
    if (
      sellerProfile.editingRevision &&
      !this.isSellerVisibility(sellerProfile.status, input.status)
    ) {
      this.logger.warn(
        'Blocked parent target that would review an editing revision',
      );
      throw new ConflictException('Seller profile transition is not allowed');
    }
  }

  private assertFreshProductTarget(
    product: {
      status: string;
      updatedAt: Date;
      editingRevision: { id: string; status: string; updatedAt: Date } | null;
    },
    input: AdminProductStatusUpdateRequest,
  ) {
    if (input.target.kind === 'revision') {
      const revision = product.editingRevision;
      if (
        !revision ||
        revision.id !== input.target.id ||
        !this.sameInstant(revision.updatedAt, input.target.updatedAt) ||
        revision.status !== 'PENDING_REVIEW' ||
        !['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'].includes(input.status)
      ) {
        this.logger.warn(
          `Blocked stale product revision target=${product.editingRevision?.id ?? 'none'}`,
        );
        throw new ConflictException('Moderation target is stale');
      }
      return;
    }

    if (
      product.status !== input.target.status ||
      !this.sameInstant(product.updatedAt, input.target.updatedAt)
    ) {
      this.logger.warn('Blocked stale product parent target');
      throw new ConflictException('Moderation target is stale');
    }
  }

  private isSellerVisibility(parentStatus: string, next: string) {
    return (
      (parentStatus === 'APPROVED' && next === 'SUSPENDED') ||
      (parentStatus === 'SUSPENDED' && next === 'APPROVED')
    );
  }

  private sameInstant(value: Date, expected: string) {
    return value.getTime() === new Date(expected).getTime();
  }

  private async latestModerationReasons(
    targetType: 'SELLER_PROFILE' | 'PRODUCT',
    targetIds: string[],
  ) {
    const reasons = new Map<string, string>();
    if (targetIds.length === 0) return reasons;
    const rows = await this.prisma.$queryRaw<
      Array<{ target_id: string; reason: string | null }>
    >(latestModerationReasonSql(targetType, targetIds));
    for (const row of rows) {
      if (row.reason) reasons.set(row.target_id, row.reason);
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

  private requiredApprovedSellerPhoto(sellerProfile: {
    fullName: string | null;
    discipline: string | null;
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
    discipline: string | null;
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

  async mapCatalogProposal(
    adminUserId: string,
    proposalId: string,
    target: { categoryId?: string | undefined; termId?: string | undefined },
  ) {
    return this.resolveCatalogProposal(adminUserId, proposalId, target);
  }

  async rejectCatalogProposal(
    adminUserId: string,
    proposalId: string,
    reason: string,
  ) {
    return this.resolveCatalogProposal(adminUserId, proposalId, { reason });
  }

  private async resolveCatalogProposal(
    adminUserId: string,
    proposalId: string,
    target: {
      categoryId?: string | undefined;
      termId?: string | undefined;
      reason?: string | undefined;
    },
  ) {
    return runReadCommittedTransaction(this.prisma, async (tx) => {
      const located = await tx.catalogProposal.findUnique({
        where: { id: proposalId },
        select: { revision: { select: { productId: true } } },
      });
      if (!located) {
        throw new ConflictException('Catalog proposal is not awaiting review');
      }
      await lockProductRowForUpdate(tx, located.revision.productId);
      const proposal = await tx.catalogProposal.findUnique({
        where: { id: proposalId },
      });
      if (!proposal || proposal.status !== 'PENDING' || !proposal.selected) {
        throw new ConflictException('Catalog proposal is not awaiting review');
      }
      const revision = await tx.productRevision.findUnique({
        where: { id: proposal.productRevisionId },
        select: {
          id: true,
          status: true,
          productId: true,
          product: { select: { editingRevisionId: true, status: true } },
        },
      });
      if (
        !revision ||
        revision.product.editingRevisionId !== revision.id ||
        revision.status !== 'PENDING_REVIEW'
      ) {
        throw new ConflictException('Moderation target is stale');
      }
      if (this.media?.enabled) {
        await this.media.assertNotPending(tx, { productId: revision.productId });
      }
      if (target.reason) {
        await tx.catalogProposal.update({
          where: { id: proposal.id },
          data: {
            status: 'REJECTED',
            rejectionReason: target.reason,
            reviewedByUserId: adminUserId,
            reviewedAt: new Date(),
          },
        });
        await tx.productRevision.update({
          where: { id: revision.id },
          data: { status: 'CHANGES_REQUESTED', reviewedAt: new Date() },
        });
        if (revision.product.status === 'PENDING_REVIEW') {
          await tx.product.update({
            where: { id: revision.productId },
            data: { status: 'CHANGES_REQUESTED' },
          });
        }
        if (this.media?.enabled) {
          await this.media.cancelPublication(tx, { productId: revision.productId });
        }
        await tx.auditEvent.create({
          data: {
            actorUserId: adminUserId,
            targetType: 'PRODUCT',
            targetId: revision.productId,
            action: 'DECISION',
            revisionId: revision.id,
            oldStatus: 'PENDING_REVIEW',
            newStatus: 'CHANGES_REQUESTED',
            reason: target.reason,
          },
        });
        return { ok: true as const };
      }

      if (proposal.kind === 'CATEGORY') {
        if (!target.categoryId) {
          throw new ConflictException('Category proposal must map to a category');
        }
        const category = await tx.category.findUnique({
          where: { id: target.categoryId },
          select: { id: true, active: true },
        });
        if (!category?.active) throw new ConflictException('Category is unavailable');
        await tx.productRevision.update({
          where: { id: revision.id },
          data: { categoryId: category.id },
        });
        await tx.catalogProposal.update({
          where: { id: proposal.id },
          data: {
            status: 'APPROVED',
            mappedCategoryId: category.id,
            reviewedByUserId: adminUserId,
            reviewedAt: new Date(),
          },
        });
      } else {
        if (!target.termId) {
          throw new ConflictException('Term proposal must map to a term');
        }
        const term = await tx.catalogTerm.findUnique({
          where: { id: target.termId },
          select: { id: true, role: true, active: true },
        });
        if (!term?.active || term.role !== proposal.kind) {
          throw new ConflictException('Catalog term is unavailable');
        }
        await tx.productRevisionTerm.createMany({
          data: [{ revisionId: revision.id, termId: term.id }],
          skipDuplicates: true,
        });
        await writeTermLabel(
          tx,
          revision.id,
          proposal.kind === 'TECHNIQUE' ? 'TECHNIQUE' : 'MATERIAL',
        );
        await tx.catalogProposal.update({
          where: { id: proposal.id },
          data: {
            status: 'APPROVED',
            mappedTermId: term.id,
            reviewedByUserId: adminUserId,
            reviewedAt: new Date(),
          },
        });
      }
      await tx.auditEvent.create({
        data: {
          actorUserId: adminUserId,
          targetType: 'PRODUCT',
          targetId: revision.productId,
          oldStatus: proposal.status,
          newStatus: 'APPROVED',
          reason: `map ${proposal.kind} proposal`,
        },
      });
      return { ok: true as const };
    });
  }
}
