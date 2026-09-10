import {
  publicSellerListResponseSchema,
  publicSellerDetailResponseSchema,
  sellerProductDetailResponseSchema,
  sellerProductListResponseSchema,
  type PublicSellerQuery,
  type PublicSellerWorksQuery,
  type SellerProfileCreateRequest,
  type SellerProfileUpdateRequest,
  type PortfolioAchievementWriteRequest,
  portfolioAchievementResponseSchema,
} from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';

import {
  isPrismaUniqueConstraintError,
  PrismaService,
  runReadCommittedTransaction,
} from '../core/database';
import {
  emptyImageBytes,
  ImageStore,
  imageKey,
  RevisionMediaStorageError,
} from '../core/image-store';
import { type ValidatedImageUpload } from '../images/image-policy';
import {
  productSelect,
  toContractProduct,
  publicCatalogProductSelect,
  toCreationStepContract,
} from '../products/products.mapper';
import { ProductsService } from '../products/products.service';
import {
  publicAuthorCityWhere,
  publicCatalogProductWhere,
  publicProductContentSql,
} from '../products/public-visibility';
import {
  publicAuthorCte,
  publicAuthorOrderBy,
  type PublicAuthorPageRow,
} from './sellers-catalog.query';
import {
  publicSellerProfileSelect,
  sellerProfilePhotoSelect,
  sellerProfileOwnerSelect,
  toPublicSellerProfile,
  toSellerProfileResponse,
} from './seller-profile.mapper';
import { lockSellerProfileRevisionRowForUpdate } from './seller-profile-revision-lock';
import { canAuthorEditSellerProfileRevision } from './seller-profile-revision-state';

export function countPublicSellerStatuses(
  products: Array<{ listings: Array<{ status: string }> }>,
) {
  const counts = { SCHEDULED: 0, LIVE: 0, ENDED: 0 };

  for (const product of products) {
    const status = product.listings[0]?.status;
    if (status === 'SCHEDULED' || status === 'LIVE' || status === 'ENDED') {
      counts[status] += 1;
    }
  }

  return counts;
}

function assertProfileRevisionReadyToSubmit(revision: {
  slug: string;
  discipline: string;
  fullName: string;
  country: string;
  city: string | null;
  socialLink: string | null;
  shortDescription: string;
  profilePhotoMimeType: string | null;
  profilePhotoByteLength: number | null;
  profilePhotoChecksum: string | null;
  profilePhotoObjectKey: string | null;
}) {
  if (
    !revision.slug ||
    !revision.discipline ||
    !revision.fullName ||
    !revision.country ||
    !revision.city ||
    !revision.shortDescription ||
    !revision.profilePhotoMimeType ||
    !revision.profilePhotoByteLength ||
    !revision.profilePhotoChecksum ||
    !revision.profilePhotoObjectKey
  ) {
    throw new ConflictException('Author profile is missing required fields');
  }
}

async function putStoredImage(
  imageStore: ImageStore,
  key: string,
  object: { bytes: Uint8Array; mimeType: string },
  client?: Parameters<ImageStore['put']>[2],
) {
  try {
    await imageStore.put(key, object, client);
  } catch (error) {
    if (error instanceof RevisionMediaStorageError) {
      throw new ServiceUnavailableException(error.message);
    }
    throw error;
  }
}

function publicProfileRevisionData(input: SellerProfileUpdateRequest) {
  return {
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.discipline !== undefined ? { discipline: input.discipline } : {}),
    ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
    ...(input.country !== undefined ? { country: input.country } : {}),
    ...(input.city !== undefined ? { city: input.city } : {}),
    ...(input.practice !== undefined ? { practice: input.practice } : {}),
    ...(input.socialLink !== undefined ? { socialLink: input.socialLink } : {}),
    ...(input.telegramUrl !== undefined
      ? { telegramUrl: input.telegramUrl }
      : {}),
    ...(input.instagramUrl !== undefined
      ? { instagramUrl: input.instagramUrl }
      : {}),
    ...(input.websiteUrl !== undefined ? { websiteUrl: input.websiteUrl } : {}),
    ...(input.shortDescription !== undefined
      ? { shortDescription: input.shortDescription }
      : {}),
  };
}

type PublicSellerProductPageRow = { id: string };
type PublicSellerCountRow = { total: number | bigint };
type PublicSellerStatusRow = {
  status: 'SCHEDULED' | 'LIVE' | 'ENDED';
  count: number | bigint;
};

function publicSellerProductsCte(
  slug: string,
  status?: PublicSellerWorksQuery['status'],
) {
  const statusFilter = status
    ? Prisma.sql`AND c."status" = CAST(${status} AS "ListingStatus")`
    : Prisma.empty;

  return Prisma.sql`WITH canonical AS (
    SELECT DISTINCT ON (l."product_id")
      l."product_id",
      l."status",
      l."current_price",
      l."bid_count",
      l."ends_at",
      l."created_at" AS "listing_created_at"
    FROM "listings" l
    WHERE l."status" IN ('LIVE', 'SCHEDULED', 'ENDED')
    ORDER BY
      l."product_id",
      CASE l."status"
        WHEN 'LIVE' THEN 0
        WHEN 'SCHEDULED' THEN 1
        ELSE 2
      END,
      l."created_at" DESC,
      l."id" DESC
  ), filtered AS (
    SELECT
      p."id",
      p."created_at",
      c."status",
      c."current_price",
      c."bid_count",
      c."ends_at"
    FROM "products" p
    INNER JOIN "seller_profiles" sp ON sp."id" = p."seller_profile_id"
    INNER JOIN canonical c ON c."product_id" = p."id"
    WHERE p."status" = 'APPROVED'
      AND sp."status" = 'APPROVED'
      AND sp."slug" = ${slug}
      AND ${publicProductContentSql}
      ${statusFilter}
  )`;
}

function publicSellerProductsOrderBy(sort: PublicSellerWorksQuery['sort']) {
  switch (sort) {
    case 'priceAsc':
      return 'p."current_price" ASC, p."id" ASC';
    case 'priceDesc':
      return 'p."current_price" DESC, p."id" ASC';
    case 'newest':
      return 'p."created_at" DESC, p."id" ASC';
    case 'oldest':
      return 'p."created_at" ASC, p."id" ASC';
    case 'activity':
      return 'p."bid_count" DESC, p."created_at" DESC, p."id" ASC';
  }
}

@Injectable()
export class SellersService {
  private readonly logger = new Logger(SellersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly products: ProductsService,
    private readonly imageStore: ImageStore,
  ) {}

  async getMine(userId: string) {
    const sellerProfile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      select: sellerProfileOwnerSelect,
    });

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    return toSellerProfileResponse(sellerProfile);
  }

  async create(
    userId: string,
    input: SellerProfileCreateRequest,
    profilePhoto: ValidatedImageUpload,
  ) {
    const existing = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException('Seller profile already exists');
    }

    try {
      const sellerProfile = await this.prisma.$transaction(async (tx) => {
        const created = await tx.sellerProfile.create({
          data: {
            userId,
            slug: input.slug,
            sellerType: input.sellerType,
            ...(input.discipline ? { discipline: input.discipline } : {}),
            fullName: input.fullName,
            country: input.country,
            city: input.city,
            practice: input.practice ?? null,
            socialLink: input.socialLink ?? null,
            telegramUrl: input.telegramUrl ?? null,
            instagramUrl: input.instagramUrl ?? null,
            websiteUrl: input.websiteUrl ?? null,
            shortDescription: input.shortDescription,
            handoffContactType: input.handoffContactType,
            handoffContactValue: input.handoffContactValue,
            handoffInitiator: input.handoffInitiator ?? 'BUYER_CONTACTS_SELLER',
            profilePhotoMimeType: profilePhoto.mimeType,
            profilePhotoByteLength: profilePhoto.buffer.byteLength,
            profilePhotoChecksum: createHash('sha256')
              .update(profilePhoto.buffer)
              .digest('hex'),
            profilePhotoData: emptyImageBytes,
          },
          select: sellerProfileOwnerSelect,
        });

        await this.imageStore.put(
          imageKey.sellerPhoto(created.id),
          {
            bytes: profilePhoto.buffer,
            mimeType: profilePhoto.mimeType,
          },
          tx,
        );
        await tx.sellerProfile.update({
          where: { id: created.id },
          data: { profilePhotoObjectKey: imageKey.sellerPhoto(created.id) },
        });

        const revision = await tx.sellerProfileRevision.create({
          data: {
            sellerProfileId: created.id,
            version: 1,
            status: 'PENDING_REVIEW',
            slug: input.slug,
            discipline: input.discipline ?? 'Автор',
            fullName: input.fullName,
            country: input.country,
            city: input.city,
            practice: input.practice ?? null,
            socialLink: input.socialLink ?? null,
            telegramUrl: input.telegramUrl ?? null,
            instagramUrl: input.instagramUrl ?? null,
            websiteUrl: input.websiteUrl ?? null,
            shortDescription: input.shortDescription,
            profilePhotoMimeType: profilePhoto.mimeType,
            profilePhotoByteLength: profilePhoto.buffer.byteLength,
            profilePhotoChecksum: createHash('sha256')
              .update(profilePhoto.buffer)
              .digest('hex'),
            profilePhotoObjectKey: imageKey.sellerPhoto(created.id),
            submittedAt: new Date(),
          },
        });
        await tx.sellerProfile.update({
          where: { id: created.id },
          data: { editingRevisionId: revision.id },
        });

        return tx.sellerProfile.findUniqueOrThrow({
          where: { id: created.id },
          select: sellerProfileOwnerSelect,
        });
      });

      return toSellerProfileResponse(sellerProfile);
    } catch (error: unknown) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new ConflictException(
          'Seller profile already exists or slug is already taken',
        );
      }

      throw error;
    }
  }

  async update(
    userId: string,
    input: SellerProfileUpdateRequest,
    profilePhoto?: ValidatedImageUpload,
  ) {
    const current = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        status: true,
        slug: true,
        editingRevisionId: true,
      },
    });

    if (!current) {
      throw new NotFoundException('Seller profile not found');
    }

    if (current.status === 'APPROVED') {
      if (
        input.sellerType !== undefined ||
        input.handoffContactType !== undefined ||
        input.handoffContactValue !== undefined ||
        input.handoffInitiator !== undefined
      ) {
        throw new ForbiddenException(
          'Only public profile fields can be revised after approval',
        );
      }

      const sellerProfile = await runReadCommittedTransaction(
        this.prisma,
        async (tx) => {
          const profile = await tx.sellerProfile.findUnique({
            where: { id: current.id },
            include: {
              editingRevision: true,
              publishedRevision: {
                include: {
                  achievements: { orderBy: { position: 'asc' } },
                },
              },
            },
          });
          if (!profile?.publishedRevision) {
            throw new ConflictException(
              'Published profile revision is missing',
            );
          }
          let revisionId = profile.editingRevisionId;
          if (revisionId === profile.publishedRevisionId) {
            const published = profile.publishedRevision;
            const editing = await tx.sellerProfileRevision.create({
              data: {
                sellerProfileId: profile.id,
                version: published.version + 1,
                status: 'DRAFT',
                slug: published.slug,
                discipline: published.discipline,
                fullName: published.fullName,
                country: published.country,
                city: published.city,
                practice: published.practice,
                socialLink: published.socialLink,
                telegramUrl: published.telegramUrl,
                instagramUrl: published.instagramUrl,
                websiteUrl: published.websiteUrl,
                shortDescription: published.shortDescription,
                profilePhotoMimeType: published.profilePhotoMimeType,
                profilePhotoByteLength: published.profilePhotoByteLength,
                profilePhotoChecksum: published.profilePhotoChecksum,
                profilePhotoObjectKey: published.profilePhotoObjectKey,
                achievements: {
                  create: published.achievements.map((achievement) => ({
                    position: achievement.position,
                    occurredAt: achievement.occurredAt,
                    body: achievement.body,
                    mimeType: achievement.mimeType,
                    byteLength: achievement.byteLength,
                    checksum: achievement.checksum,
                    objectKey: achievement.objectKey,
                  })),
                },
              },
            });
            revisionId = editing.id;
            await tx.sellerProfile.update({
              where: { id: profile.id },
              data: { editingRevisionId: revisionId },
            });
          }
          if (!revisionId) {
            throw new ConflictException('Profile editing revision is missing');
          }
          const editing = await tx.sellerProfileRevision.findUniqueOrThrow({
            where: { id: revisionId },
            select: { status: true },
          });
          if (!canAuthorEditSellerProfileRevision(editing.status)) {
            throw new ConflictException('Seller profile revision is locked');
          }
          const profilePhotoData = profilePhoto
            ? {
                profilePhotoMimeType: profilePhoto.mimeType,
                profilePhotoByteLength: profilePhoto.buffer.byteLength,
                profilePhotoChecksum: createHash('sha256')
                  .update(profilePhoto.buffer)
                  .digest('hex'),
                profilePhotoObjectKey:
                  imageKey.sellerProfileRevision(revisionId),
              }
            : {};
          await tx.sellerProfileRevision.update({
            where: { id: revisionId },
            data: {
              ...publicProfileRevisionData(input),
              ...profilePhotoData,
            },
          });
          if (profilePhoto) {
            await putStoredImage(
              this.imageStore,
              imageKey.sellerProfileRevision(revisionId),
              { bytes: profilePhoto.buffer, mimeType: profilePhoto.mimeType },
              tx,
            );
          }
          return tx.sellerProfile.findUniqueOrThrow({
            where: { id: profile.id },
            select: sellerProfileOwnerSelect,
          });
        },
      );
      return toSellerProfileResponse(sellerProfile);
    }

    if (
      current.status !== 'CHANGES_REQUESTED' &&
      current.status !== 'REJECTED'
    ) {
      throw new ForbiddenException('Seller profile cannot be edited');
    }

    const data = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    );

    if (profilePhoto) {
      Object.assign(data, {
        profilePhotoMimeType: profilePhoto.mimeType,
        profilePhotoByteLength: profilePhoto.buffer.byteLength,
        profilePhotoChecksum: createHash('sha256')
          .update(profilePhoto.buffer)
          .digest('hex'),
      });
    }

    try {
      if (profilePhoto) {
        const sellerProfile = await this.prisma.$transaction(async (tx) => {
          const updated = await tx.sellerProfile.update({
            where: { id: current.id },
            data,
            select: sellerProfileOwnerSelect,
          });

          await this.imageStore.put(
            imageKey.sellerPhoto(current.id),
            {
              bytes: profilePhoto.buffer,
              mimeType: profilePhoto.mimeType,
            },
            tx,
          );

          if (!current.editingRevisionId) {
            throw new ConflictException('Profile editing revision is missing');
          }
          await tx.sellerProfileRevision.update({
            where: { id: current.editingRevisionId },
            data: {
              ...publicProfileRevisionData(input),
              profilePhotoMimeType: profilePhoto.mimeType,
              profilePhotoByteLength: profilePhoto.buffer.byteLength,
              profilePhotoChecksum: createHash('sha256')
                .update(profilePhoto.buffer)
                .digest('hex'),
              profilePhotoObjectKey: imageKey.sellerPhoto(current.id),
            },
          });

          return updated;
        });

        return toSellerProfileResponse(sellerProfile);
      }

      const sellerProfile = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.sellerProfile.update({
          where: { id: current.id },
          data,
          select: sellerProfileOwnerSelect,
        });
        if (!current.editingRevisionId) {
          throw new ConflictException('Profile editing revision is missing');
        }
        await tx.sellerProfileRevision.update({
          where: { id: current.editingRevisionId },
          data: publicProfileRevisionData(input),
        });
        return updated;
      });

      return toSellerProfileResponse(sellerProfile);
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Seller profile not found');
        }

        if (error.code === 'P2002') {
          throw new ConflictException('Seller profile slug is already taken');
        }
      }

      throw error;
    }
  }

  async submitProfileRevision(userId: string) {
    return runReadCommittedTransaction(this.prisma, async (tx) => {
      const profile = await tx.sellerProfile.findUnique({
        where: { userId },
        include: { editingRevision: true },
      });
      if (!profile?.editingRevision) {
        throw new NotFoundException('Seller profile revision not found');
      }
      if (profile.status === 'SUSPENDED') {
        throw new ForbiddenException('Seller profile is suspended');
      }
      const revision = profile.editingRevision;
      if (
        !['DRAFT', 'CHANGES_REQUESTED', 'REJECTED'].includes(revision.status)
      ) {
        throw new ConflictException(
          'Seller profile revision cannot be submitted',
        );
      }
      assertProfileRevisionReadyToSubmit(revision);
      await tx.sellerProfileRevision.update({
        where: { id: revision.id },
        data: { status: 'PENDING_REVIEW', submittedAt: new Date() },
      });
      if (profile.status !== 'APPROVED') {
        await tx.sellerProfile.update({
          where: { id: profile.id },
          data: { status: 'PENDING_REVIEW' },
        });
      }
      return tx.sellerProfile.findUniqueOrThrow({
        where: { id: profile.id },
        select: sellerProfileOwnerSelect,
      });
    }).then(toSellerProfileResponse);
  }

  async addAchievement(
    userId: string,
    input: PortfolioAchievementWriteRequest,
    image?: ValidatedImageUpload,
  ) {
    return runReadCommittedTransaction(this.prisma, async (tx) => {
      const revision = await this.editableRevision(tx, userId);
      await lockSellerProfileRevisionRowForUpdate(tx, revision.id);
      const position = await tx.sellerProfileRevisionAchievement.count({
        where: { revisionId: revision.id },
      });
      const achievement = await tx.sellerProfileRevisionAchievement.create({
        data: {
          revisionId: revision.id,
          position,
          occurredAt: input.occurredAt ? new Date(input.occurredAt) : null,
          body: input.body,
          mimeType: image?.mimeType ?? null,
          byteLength: image?.buffer.byteLength ?? null,
          checksum: image
            ? createHash('sha256').update(image.buffer).digest('hex')
            : null,
        },
      });
      if (image) {
        const objectKey = imageKey.sellerAchievement(achievement.id);
        await tx.sellerProfileRevisionAchievement.update({
          where: { id: achievement.id },
          data: { objectKey },
        });
        await putStoredImage(
          this.imageStore,
          objectKey,
          { bytes: image.buffer, mimeType: image.mimeType },
          tx,
        );
      }
      return portfolioAchievementResponseSchema.parse({
        achievement: {
          id: achievement.id,
          occurredAt: achievement.occurredAt?.toISOString() ?? null,
          body: achievement.body,
          image: image
            ? {
                url: `/api/author-achievements/${achievement.id}/image`,
                mimeType: image.mimeType,
                byteLength: image.buffer.byteLength,
                checksum: createHash('sha256')
                  .update(image.buffer)
                  .digest('hex'),
              }
            : null,
        },
      });
    });
  }

  async deleteAchievement(userId: string, achievementId: string) {
    const objectKeyToDelete = await runReadCommittedTransaction(
      this.prisma,
      async (tx) => {
        const profile = await tx.sellerProfile.findUnique({
          where: { userId },
          include: { editingRevision: true },
        });
        if (!profile?.editingRevision) {
          throw new NotFoundException('Achievement not found');
        }
        if (profile.status === 'SUSPENDED') {
          throw new ForbiddenException('Seller profile is suspended');
        }
        await lockSellerProfileRevisionRowForUpdate(
          tx,
          profile.editingRevision.id,
        );
        const achievement = await tx.sellerProfileRevisionAchievement.findFirst(
          {
            where: {
              id: achievementId,
              revisionId: profile.editingRevision.id,
            },
            select: { id: true, objectKey: true },
          },
        );
        if (!achievement) {
          throw new NotFoundException('Achievement not found');
        }
        if (
          !canAuthorEditSellerProfileRevision(profile.editingRevision.status)
        ) {
          throw new ConflictException('Seller profile revision is locked');
        }
        await tx.sellerProfileRevisionAchievement.delete({
          where: { id: achievement.id },
        });
        let deletedKey: string | null = null;
        if (achievement.objectKey) {
          const remainingReferences =
            await tx.sellerProfileRevisionAchievement.count({
              where: { objectKey: achievement.objectKey },
            });
          if (remainingReferences === 0) {
            deletedKey = achievement.objectKey;
          }
        }
        const remaining = await tx.sellerProfileRevisionAchievement.findMany({
          where: { revisionId: profile.editingRevision.id },
          select: { id: true },
          orderBy: { position: 'asc' },
        });
        const temporaryBase = remaining.length + 1;
        await Promise.all(
          remaining.map((item, index) =>
            tx.sellerProfileRevisionAchievement.update({
              where: { id: item.id },
              data: { position: temporaryBase + index },
            }),
          ),
        );
        await Promise.all(
          remaining.map((item, index) =>
            tx.sellerProfileRevisionAchievement.update({
              where: { id: item.id },
              data: { position: index },
            }),
          ),
        );
        return deletedKey;
      },
    );
    if (objectKeyToDelete) {
      try {
        await this.imageStore.delete(objectKeyToDelete);
      } catch (error) {
        this.logger.warn(
          `Failed to delete unreferenced achievement image ${objectKeyToDelete}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
    return { ok: true as const };
  }

  async getEditingPhoto(userId: string) {
    const sellerProfile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      select: {
        editingRevision: {
          select: {
            profilePhotoObjectKey: true,
          },
        },
      },
    });
    if (!sellerProfile?.editingRevision?.profilePhotoObjectKey) {
      throw new NotFoundException('Seller profile photo not found');
    }
    const stored = await this.imageStore.get(
      sellerProfile.editingRevision.profilePhotoObjectKey,
    );
    if (!stored) {
      throw new NotFoundException('Seller profile photo not found');
    }
    return {
      mimeType: stored.mimeType,
      data: stored.bytes,
    };
  }

  async getAchievementImage(
    achievementId: string,
    userId?: string,
    role?: string,
  ) {
    const achievement =
      await this.prisma.sellerProfileRevisionAchievement.findUnique({
        where: { id: achievementId },
        select: {
          mimeType: true,
          objectKey: true,
          revisionId: true,
          revision: {
            select: {
              sellerProfile: {
                select: {
                  userId: true,
                  status: true,
                  publishedRevisionId: true,
                },
              },
            },
          },
        },
      });
    if (!achievement?.mimeType || !achievement.objectKey) {
      throw new NotFoundException('Achievement image not found');
    }
    const profile = achievement.revision.sellerProfile;
    const isPublic =
      profile.status === 'APPROVED' &&
      profile.publishedRevisionId === achievement.revisionId;
    if (profile.userId !== userId && role !== 'admin' && !isPublic) {
      throw new NotFoundException('Achievement image not found');
    }
    const stored = await this.imageStore.get(achievement.objectKey);
    if (!stored) {
      throw new NotFoundException('Achievement image not found');
    }
    return { mimeType: stored.mimeType, data: stored.bytes, isPublic };
  }

  private async editableRevision(
    tx: Parameters<Parameters<typeof runReadCommittedTransaction>[1]>[0],
    userId: string,
  ) {
    const profile = await tx.sellerProfile.findUnique({
      where: { userId },
      include: { editingRevision: true },
    });
    if (!profile?.editingRevision) {
      throw new NotFoundException('Seller profile revision not found');
    }
    if (profile.status === 'SUSPENDED') {
      throw new ForbiddenException('Seller profile is suspended');
    }
    if (!canAuthorEditSellerProfileRevision(profile.editingRevision.status)) {
      throw new ConflictException('Seller profile revision is locked');
    }
    return profile.editingRevision;
  }

  async listProducts(userId: string) {
    const sellerProfile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    const products = await this.prisma.product.findMany({
      where: { sellerProfileId: sellerProfile.id },
      select: productSelect,
      orderBy: { createdAt: 'desc' },
    });

    return sellerProductListResponseSchema.parse({
      products: products.map(toContractProduct),
    });
  }

  async listCabinetWorks(userId: string) {
    const sellerProfile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    const products = await this.prisma.product.findMany({
      where: { sellerProfileId: sellerProfile.id },
      select: {
        id: true,
        publicId: true,
        title: true,
        status: true,
        updatedAt: true,
        editingRevision: {
          select: { title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const reasons =
      products.length === 0
        ? []
        : await this.prisma.auditEvent.findMany({
            where: {
              targetType: 'PRODUCT',
              targetId: { in: products.map((product) => product.id) },
              reason: { not: null },
            },
            orderBy: { createdAt: 'desc' },
            select: { targetId: true, reason: true },
          });
    const reasonByProductId = new Map<string, string>();
    for (const row of reasons) {
      if (row.reason && !reasonByProductId.has(row.targetId)) {
        reasonByProductId.set(row.targetId, row.reason);
      }
    }

    return products.map((product) => ({
      id: product.id,
      publicId: product.publicId,
      title: product.editingRevision?.title ?? product.title,
      status: product.status,
      updatedAt: product.updatedAt.toISOString(),
      moderationMessage: reasonByProductId.get(product.id) ?? null,
    }));
  }

  async getProduct(userId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, sellerProfile: { userId } },
      select: {
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
      },
    });

    if (!product) throw new NotFoundException('Product not found');

    const latestReason = await this.prisma.auditEvent.findFirst({
      where: {
        targetType: 'PRODUCT',
        targetId: product.id,
        reason: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      select: { reason: true },
    });

    return sellerProductDetailResponseSchema.parse({
      product: toContractProduct(product),
      creationIntro: product.creationIntro ?? null,
      creationSteps: product.creationSteps.map(toCreationStepContract),
      lastModerationReason: latestReason?.reason ?? null,
    });
  }

  async listPublic(
    query: PublicSellerQuery,
    options: { requireCity?: boolean } = {},
  ) {
    const cte = publicAuthorCte(query, options);
    const pageRows = await this.prisma.$queryRaw<PublicAuthorPageRow[]>(
      Prisma.sql`${cte}
        SELECT "id", COUNT(*) OVER()::int AS "total"
        FROM filtered
        ORDER BY ${Prisma.raw(publicAuthorOrderBy(query.sort))}
        LIMIT ${query.limit}
        OFFSET ${(query.page - 1) * query.limit}`,
    );
    const total = pageRows.length
      ? Number(pageRows[0]!.total)
      : Number(
          (
            await this.prisma.$queryRaw<Array<{ total: number | bigint }>>(
              Prisma.sql`${cte}
                SELECT COUNT(*)::int AS "total"
                FROM filtered`,
            )
          )[0]?.total ?? 0,
        );

    if (!pageRows.length) {
      return publicSellerListResponseSchema.parse({
        sellers: [],
        pagination: { page: query.page, limit: query.limit, total },
      });
    }

    const sellers = await this.prisma.sellerProfile.findMany({
      where: { id: { in: pageRows.map((row) => row.id) } },
      select: {
        ...publicSellerProfileSelect,
        _count: {
          select: { products: { where: publicCatalogProductWhere } },
        },
      },
    });
    const sellersById = new Map(sellers.map((seller) => [seller.id, seller]));
    const pagedSellers = pageRows
      .map((row) => sellersById.get(row.id))
      .filter((seller): seller is (typeof sellers)[number] => Boolean(seller));

    return publicSellerListResponseSchema.parse({
      sellers: pagedSellers.map((seller) => ({
        sellerProfile: toPublicSellerProfile(seller),
        workCount: seller._count.products,
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
      },
    });
  }

  async getApprovedPublicAuthor(
    slug: string,
    options: { requireCity?: boolean } = {},
  ) {
    const sellerProfile = await this.prisma.sellerProfile.findFirst({
      where: {
        slug,
        status: 'APPROVED',
        ...(options.requireCity ? { city: publicAuthorCityWhere } : {}),
      },
      select: publicSellerProfileSelect,
    });
    if (!sellerProfile || (options.requireCity && !sellerProfile.city?.trim())) {
      return null;
    }
    return {
      sellerProfile: toPublicSellerProfile(sellerProfile),
    };
  }

  async getPublic(
    slug: string,
    query: PublicSellerWorksQuery = { page: 1, limit: 20, sort: 'activity' },
    options: { requireCity?: boolean } = {},
  ) {
    const sellerProfile = await this.prisma.sellerProfile.findFirst({
      where: {
        slug,
        status: 'APPROVED',
        ...(options.requireCity ? { city: publicAuthorCityWhere } : {}),
      },
      select: publicSellerProfileSelect,
    });

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    const pageCte = publicSellerProductsCte(slug, query.status);
    const countCte = publicSellerProductsCte(slug);
    const [pageRows, totalRows, statusRows] = await Promise.all([
      this.prisma.$queryRaw<PublicSellerProductPageRow[]>(
        Prisma.sql`${pageCte}
          SELECT p."id"
          FROM filtered p
          ORDER BY ${Prisma.raw(publicSellerProductsOrderBy(query.sort))}
          LIMIT ${query.limit}
          OFFSET ${(query.page - 1) * query.limit}`,
      ),
      this.prisma.$queryRaw<PublicSellerCountRow[]>(
        Prisma.sql`${countCte} SELECT COUNT(*)::int AS "total" FROM filtered`,
      ),
      this.prisma.$queryRaw<PublicSellerStatusRow[]>(
        Prisma.sql`${countCte}
          SELECT "status", COUNT(*)::int AS "count"
          FROM filtered
          GROUP BY "status"`,
      ),
    ]);

    const products = pageRows.length
      ? await this.prisma.product.findMany({
          where: { id: { in: pageRows.map((row) => row.id) } },
          select: publicCatalogProductSelect,
        })
      : [];
    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );
    const orderedProducts = pageRows
      .map((row) => productsById.get(row.id))
      .filter(
        (product): product is (typeof products)[number] =>
          product !== undefined,
      );
    const statusCounts = { SCHEDULED: 0, LIVE: 0, ENDED: 0 };
    for (const row of statusRows) statusCounts[row.status] = Number(row.count);
    const total = Number(totalRows[0]?.total ?? 0);

    return publicSellerDetailResponseSchema.parse({
      sellerProfile: toPublicSellerProfile(sellerProfile),
      products: orderedProducts.map((product) =>
        this.products.toPublicProduct(product),
      ),
      statusCounts,
      pagination: { page: query.page, limit: query.limit, total },
    });
  }

  async getPhoto(slug: string, userId?: string, role?: string) {
    const sellerProfile = await this.prisma.sellerProfile.findFirst({
      where: { slug },
      select: sellerProfilePhotoSelect,
    });

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    const isOwner = sellerProfile.userId === userId;
    const isAdmin = role === 'admin';
    const isPublic = sellerProfile.status === 'APPROVED';

    if (!isOwner && !isAdmin && !isPublic) {
      throw new NotFoundException('Seller profile not found');
    }

    if (!sellerProfile.profilePhotoObjectKey) {
      throw new NotFoundException('Seller profile not found');
    }
    const stored = await this.imageStore.get(sellerProfile.profilePhotoObjectKey);

    if (!stored) {
      throw new NotFoundException('Seller profile not found');
    }

    return {
      status: sellerProfile.status,
      profilePhotoMimeType: stored.mimeType,
      profilePhotoData: stored.bytes,
    };
  }
}
