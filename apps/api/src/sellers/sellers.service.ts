import {
  sellerProductDetailResponseSchema,
  sellerProductListResponseSchema,
  type PortfolioAuthorsQuery,
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
  RevisionMediaStorageError,
  imageKey,
} from '../core/image-store';
import { type ValidatedImageUpload } from '../images/image-policy';
import {
  productRevisionOwnerSelect,
  productSelect,
  toCreationStepContract,
  toContractProduct,
  toOwnerContractProduct,
} from '../products/products.mapper';
import {
  portfolioCatalogProductWhere,
  publicAuthorCityWhere,
} from '../products/public-visibility';
import {
  publicAuthorCte,
  publicAuthorOrderBy,
  type PublicAuthorFacetRow,
  type PublicAuthorPageRow,
} from './sellers-catalog.query';
import {
  publicSellerProfileSelect,
  sellerProfilePhotoSelect,
  sellerProfileOwnerSelect,
  toPortfolioAchievement,
  toPublicSellerProfile,
  toSellerProfileResponse,
} from './seller-profile.mapper';
import {
  ensureEditableEditingRevision,
  resolveEditingAchievementId,
} from './ensure-editable-seller-profile-revision';

function assertProfileRevisionReadyToSubmit(revision: {
  slug: string;
  discipline: string;
  fullName: string;
  country: string;
  city: string | null;
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
    ...(input.biography !== undefined ? { biography: input.biography } : {}),
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

@Injectable()
export class SellersService {
  private readonly logger = new Logger(SellersService.name);

  constructor(
    private readonly prisma: PrismaService,
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

  async listEditingAchievements(userId: string) {
    const sellerProfile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      select: {
        editingRevision: {
          select: {
            achievements: {
              orderBy: { position: 'asc' },
              select: {
                id: true,
                occurredAt: true,
                body: true,
                mimeType: true,
                byteLength: true,
                checksum: true,
                objectKey: true,
              },
            },
          },
        },
      },
    });
    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }
    return (
      sellerProfile.editingRevision?.achievements.map(toPortfolioAchievement) ??
      []
    );
  }

  async getEditingRevision(userId: string) {
    const sellerProfile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      select: {
        editingRevision: {
          select: { id: true, version: true, status: true },
        },
      },
    });
    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }
    return sellerProfile.editingRevision;
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
            sellerType: 'creator',
            discipline: input.discipline,
            fullName: input.fullName,
            country: input.country,
            city: input.city,
            practice: input.practice ?? null,
            biography: input.biography ?? null,
            socialLink: input.socialLink ?? null,
            telegramUrl: input.telegramUrl ?? null,
            instagramUrl: input.instagramUrl ?? null,
            websiteUrl: input.websiteUrl ?? null,
            shortDescription: input.shortDescription,
            status: 'DRAFT',
            handoffContactType: null,
            handoffContactValue: null,
            handoffInitiator: null,
            profilePhotoMimeType: profilePhoto.mimeType,
            profilePhotoByteLength: profilePhoto.buffer.byteLength,
            profilePhotoChecksum: createHash('sha256')
              .update(profilePhoto.buffer)
              .digest('hex'),
            profilePhotoData: emptyImageBytes,
          },
          select: sellerProfileOwnerSelect,
        });

        await putStoredImage(
          this.imageStore,
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
            status: 'DRAFT',
            slug: input.slug,
            discipline: input.discipline,
            fullName: input.fullName,
            country: input.country,
            city: input.city,
            practice: input.practice ?? null,
            biography: input.biography ?? null,
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
          const editing = await ensureEditableEditingRevision(tx, userId);
          const profilePhotoData = profilePhoto
            ? {
                profilePhotoMimeType: profilePhoto.mimeType,
                profilePhotoByteLength: profilePhoto.buffer.byteLength,
                profilePhotoChecksum: createHash('sha256')
                  .update(profilePhoto.buffer)
                  .digest('hex'),
                profilePhotoObjectKey: imageKey.sellerProfileRevision(
                  editing.revisionId,
                ),
              }
            : {};
          await tx.sellerProfileRevision.update({
            where: { id: editing.revisionId },
            data: {
              ...publicProfileRevisionData(input),
              ...profilePhotoData,
            },
          });
          if (profilePhoto) {
            await putStoredImage(
              this.imageStore,
              imageKey.sellerProfileRevision(editing.revisionId),
              { bytes: profilePhoto.buffer, mimeType: profilePhoto.mimeType },
              tx,
            );
          }
          return tx.sellerProfile.findUniqueOrThrow({
            where: { id: editing.profileId },
            select: sellerProfileOwnerSelect,
          });
        },
      );
      return toSellerProfileResponse(sellerProfile);
    }

    if (
      current.status !== 'DRAFT' &&
      current.status !== 'CHANGES_REQUESTED' &&
      current.status !== 'REJECTED'
    ) {
      throw new ForbiddenException('Seller profile cannot be edited');
    }

    const data = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    ) as Prisma.SellerProfileUpdateInput;

    try {
      const sellerProfile = await runReadCommittedTransaction(
        this.prisma,
        async (tx) => {
          const editing = await ensureEditableEditingRevision(tx, userId);
          const profilePhotoData = profilePhoto
            ? {
                profilePhotoMimeType: profilePhoto.mimeType,
                profilePhotoByteLength: profilePhoto.buffer.byteLength,
                profilePhotoChecksum: createHash('sha256')
                  .update(profilePhoto.buffer)
                  .digest('hex'),
                profilePhotoObjectKey: imageKey.sellerPhoto(editing.profileId),
              }
            : {};
          await tx.sellerProfile.update({
            where: { id: editing.profileId },
            data: { ...data, ...profilePhotoData },
          });
          await tx.sellerProfileRevision.update({
            where: { id: editing.revisionId },
            data: { ...publicProfileRevisionData(input), ...profilePhotoData },
          });
          if (profilePhoto) {
            await putStoredImage(
              this.imageStore,
              imageKey.sellerPhoto(editing.profileId),
              { bytes: profilePhoto.buffer, mimeType: profilePhoto.mimeType },
              tx,
            );
          }
          return tx.sellerProfile.findUniqueOrThrow({
            where: { id: editing.profileId },
            select: sellerProfileOwnerSelect,
          });
        },
      );

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
      const editing = await ensureEditableEditingRevision(tx, userId);
      const profile = await tx.sellerProfile.findUniqueOrThrow({
        where: { id: editing.profileId },
        include: { editingRevision: true },
      });
      const revision = profile.editingRevision;
      if (!revision) throw new NotFoundException('Seller profile revision not found');
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
      const editing = await ensureEditableEditingRevision(tx, userId);
      const position = await tx.sellerProfileRevisionAchievement.count({
        where: { revisionId: editing.revisionId },
      });
      const achievement = await tx.sellerProfileRevisionAchievement.create({
        data: {
          revisionId: editing.revisionId,
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
        const editing = await ensureEditableEditingRevision(tx, userId);
        const targetAchievementId = await resolveEditingAchievementId(
          tx,
          editing,
          achievementId,
        );
        const achievement = await tx.sellerProfileRevisionAchievement.findFirst(
          {
            where: {
              id: targetAchievementId,
              revisionId: editing.revisionId,
            },
            select: { id: true, objectKey: true },
          },
        );
        if (!achievement) {
          throw new NotFoundException('Achievement not found');
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
          where: { revisionId: editing.revisionId },
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

  async getProduct(userId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, sellerProfile: { userId } },
      select: {
        ...productSelect,
        editingRevision: { select: productRevisionOwnerSelect },
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
      product: toOwnerContractProduct(product, product.editingRevision),
      editingRevision: product.editingRevision
        ? {
            id: product.editingRevision.id,
            version: product.editingRevision.version,
            status: product.editingRevision.status,
            updatedAt: product.editingRevision.updatedAt.toISOString(),
          }
        : null,
      creationIntro: product.creationIntro ?? null,
      creationSteps: product.creationSteps.map(toCreationStepContract),
      lastModerationReason: latestReason?.reason ?? null,
    });
  }

  async listPortfolioAuthors(
    query: PortfolioAuthorsQuery,
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
      return {
        sellers: [],
        pagination: { page: query.page, limit: query.limit, total },
      };
    }

    const sellers = await this.prisma.sellerProfile.findMany({
      where: { id: { in: pageRows.map((row) => row.id) } },
      select: {
        ...publicSellerProfileSelect,
        _count: {
          select: { products: { where: portfolioCatalogProductWhere } },
        },
      },
    });
    const sellersById = new Map(sellers.map((seller) => [seller.id, seller]));
    const pagedSellers = pageRows
      .map((row) => sellersById.get(row.id))
      .filter((seller): seller is (typeof sellers)[number] => Boolean(seller));

    return {
      sellers: pagedSellers.map((seller) => ({
        sellerProfile: toPublicSellerProfile(seller),
        workCount: seller._count.products,
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
      },
    };
  }

  async listPublicFacets() {
    const cte = publicAuthorCte(
      { page: 1, limit: 1, sort: 'added' },
      { requireCity: true },
    );
    return this.prisma.$queryRaw<PublicAuthorFacetRow[]>(
      Prisma.sql`${cte}
        SELECT "city", "discipline"
        FROM filtered`,
    );
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
    if (
      !sellerProfile ||
      (options.requireCity && !sellerProfile.city?.trim())
    ) {
      return null;
    }
    return {
      sellerProfile: toPublicSellerProfile(sellerProfile),
    };
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

    const stored = await this.imageStore.get(
      sellerProfile.profilePhotoObjectKey ??
        imageKey.sellerPhoto(sellerProfile.id),
    );

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
