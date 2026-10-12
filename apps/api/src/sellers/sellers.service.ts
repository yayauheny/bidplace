import { MediaLifecycleService } from '../core/media/media-lifecycle.service';
import {
  ApiErrorCode,
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
  Inject,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';

import {
  isPrismaUniqueConstraintError,
  prismaUniqueTargets,
  PrismaService,
  runReadCommittedTransaction,
} from '../core/database';
import { emptyImageBytes, ImageStore, imageKey } from '../core/image-store';
import { safeFailureLocation } from '../core/request-context/safe-request-log';
import { type ValidatedImageUpload } from '../images/image-policy';
import {
  productRevisionOwnerSelect,
  productSelect,
  selectionFromRevision,
  toCreationStepContract,
  toContractProduct,
  toOwnerContractProduct,
} from '../products/products.mapper';
import { storyFromRows } from '../products/product-story';
import {
  portfolioCatalogProductWhere,
  publicAuthorCityWhere,
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
  fullName: string;
  country: string;
  shortDescription: string | null;
  profilePhotoMimeType: string | null;
  profilePhotoByteLength: number | null;
  profilePhotoChecksum: string | null;
  profilePhotoObjectKey: string | null;
  directionCount: number;
}) {
  if (
    !revision.slug ||
    !revision.fullName ||
    !revision.country ||
    !revision.shortDescription ||
    revision.directionCount < 1 ||
    !revision.profilePhotoMimeType ||
    !revision.profilePhotoByteLength ||
    !revision.profilePhotoChecksum ||
    !revision.profilePhotoObjectKey
  ) {
    throw new ConflictException('Author profile is missing required fields');
  }
}

async function replaceProfileDirections(
  tx: Prisma.TransactionClient,
  revisionId: string,
  categoryIds: readonly string[],
) {
  if (new Set(categoryIds).size !== categoryIds.length) {
    throw new ConflictException('Author directions must be unique');
  }
  const current = await tx.sellerProfileRevisionDirection.findMany({
    where: { revisionId },
    select: { categoryId: true },
  });
  const keptIds = new Set(current.map((item) => item.categoryId));
  const additions = categoryIds.filter((categoryId) => !keptIds.has(categoryId));
  if (additions.length > 0) {
    const active = await tx.category.findMany({
      where: { id: { in: additions }, active: true },
      select: { id: true },
    });
    if (active.length !== additions.length) {
      throw new ConflictException('Author direction is unknown or hidden');
    }
  }
  if (categoryIds.length > 0) {
    const known = await tx.category.findMany({
      where: { id: { in: [...categoryIds] } },
      select: { id: true },
    });
    if (known.length !== categoryIds.length) {
      throw new ConflictException('Author direction is unknown or hidden');
    }
  }
  await tx.sellerProfileRevisionDirection.deleteMany({ where: { revisionId } });
  if (categoryIds.length > 0) {
    await tx.sellerProfileRevisionDirection.createMany({
      data: categoryIds.map((categoryId, position) => ({
        revisionId,
        categoryId,
        position,
      })),
    });
  }
}

function publicProfileRevisionData(input: SellerProfileUpdateRequest) {
  return {
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
    ...(input.publicEmail !== undefined
      ? { publicEmail: input.publicEmail }
      : {}),
    ...(input.shortDescription !== undefined
      ? { shortDescription: input.shortDescription }
      : {}),
  };
}

function uniqueTargetNames(error: unknown): string[] {
  return prismaUniqueTargets(error);
}

function throwSellerProfileUniqueConflict(error: unknown, unknownMessage: string): never {
  const targets = uniqueTargetNames(error);
  const slugTaken = targets.some((target) => /(^|_)slug($|_)/.test(target));
  const profileExists = targets.some(
    (target) => target === 'userId' || target.includes('user_id'),
  );
  if (slugTaken && !profileExists) {
    throw new ConflictException({
      code: ApiErrorCode.CONFLICT,
      message: 'Seller profile slug is already taken',
      details: { reason: 'slug_taken' },
    });
  }
  if (profileExists && !slugTaken) {
    throw new ConflictException({
      code: ApiErrorCode.CONFLICT,
      message: 'Seller profile already exists',
      details: { reason: 'profile_exists' },
    });
  }
  throw new ConflictException(unknownMessage);
}

@Injectable()
export class SellersService {
  private readonly logger = new Logger(SellersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly imageStore: ImageStore,
    @Inject(MediaLifecycleService)
    private readonly media?: MediaLifecycleService,
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
              orderBy: [
                { occurredAt: { sort: 'desc', nulls: 'last' } },
                { position: 'asc' },
              ],
              select: {
                id: true,
                occurredAt: true,
                occurredAtPrecision: true,
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
      sellerProfile.editingRevision?.achievements.map((achievement) =>
        toPortfolioAchievement(achievement),
      ) ?? []
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

  private async preparePhoto(
    userId: string,
    photo: ValidatedImageUpload,
    purpose: 'AUTHOR_PHOTO',
  ) {
    if (!this.media?.enabled) return { photo, asset: undefined };
    if (!photo.source)
      throw new ConflictException('Original upload bytes are required');
    const asset = await this.media.stage(userId, purpose, photo.source);
    const preview = await this.media.readPreview(asset.id);
    if (!preview) throw new ConflictException('Prepared preview is missing');
    return {
      asset,
      photo: {
        ...photo,
        buffer: Buffer.from(preview.bytes),
        mimeType: 'image/webp' as const,
        width: asset.preview.width,
        height: asset.preview.height,
      },
    };
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
      throw new ConflictException({
        code: ApiErrorCode.CONFLICT,
        message: 'Seller profile already exists',
        details: { reason: 'profile_exists' },
      });
    }

    const prepared = await this.preparePhoto(
      userId,
      profilePhoto,
      'AUTHOR_PHOTO',
    );
    profilePhoto = prepared.photo;

    try {
      const sellerProfile = await this.prisma.$transaction(async (tx) => {
        const account = await tx.user.findUnique({
          where: { id: userId },
          select: { slug: true },
        });
        if (!account?.slug) {
          throw new ConflictException(
            'Account nickname is required before an author profile',
          );
        }
        const slug = account.slug;
        const created = await tx.sellerProfile.create({
          data: {
            userId,
            slug,
            sellerType: 'creator',
            discipline: input.discipline ?? null,
            fullName: input.fullName,
            country: input.country,
            city: input.city ?? null,
            practice: input.practice ?? null,
            biography: input.biography ?? null,
            socialLink: input.socialLink ?? null,
            telegramUrl: input.telegramUrl ?? null,
            instagramUrl: input.instagramUrl ?? null,
            websiteUrl: input.websiteUrl ?? null,
            publicEmail: input.publicEmail ?? null,
            shortDescription: input.shortDescription ?? null,
            status: 'DRAFT',
            applicationStage: 'CONTACTS',
            handoffContactType: null,
            handoffContactValue: null,
            handoffInitiator: null,
            profilePhotoMimeType: profilePhoto.mimeType,
            profilePhotoByteLength: profilePhoto.buffer.byteLength,
            profilePhotoChecksum: createHash('sha256')
              .update(profilePhoto.buffer)
              .digest('hex'),
            profilePhotoData: emptyImageBytes,
            ...(prepared.asset
              ? { profilePhotoAssetId: prepared.asset.id }
              : {}),
          },
          select: sellerProfileOwnerSelect,
        });

        if (prepared.asset) await this.media!.attach(tx, prepared.asset.id);
        else
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
          data: {
            profilePhotoObjectKey:
              prepared.asset?.preview.objectKey ??
              imageKey.sellerPhoto(created.id),
          },
        });

        const revision = await tx.sellerProfileRevision.create({
          data: {
            sellerProfileId: created.id,
            version: 1,
            status: 'DRAFT',
            slug,
            discipline: input.discipline ?? null,
            fullName: input.fullName,
            country: input.country,
            city: input.city ?? null,
            practice: input.practice ?? null,
            biography: input.biography ?? null,
            socialLink: input.socialLink ?? null,
            telegramUrl: input.telegramUrl ?? null,
            instagramUrl: input.instagramUrl ?? null,
            websiteUrl: input.websiteUrl ?? null,
            publicEmail: input.publicEmail ?? null,
            shortDescription: input.shortDescription ?? null,
            profilePhotoMimeType: profilePhoto.mimeType,
            profilePhotoByteLength: profilePhoto.buffer.byteLength,
            profilePhotoChecksum: createHash('sha256')
              .update(profilePhoto.buffer)
              .digest('hex'),
            profilePhotoObjectKey:
              prepared.asset?.preview.objectKey ??
              imageKey.sellerPhoto(created.id),
            ...(prepared.asset
              ? { profilePhotoAssetId: prepared.asset.id }
              : {}),
          },
        });
        await tx.sellerProfile.update({
          where: { id: created.id },
          data: { editingRevisionId: revision.id },
        });
        if (input.directionCategoryIds?.length) {
          await replaceProfileDirections(
            tx,
            revision.id,
            input.directionCategoryIds,
          );
        }

        return tx.sellerProfile.findUniqueOrThrow({
          where: { id: created.id },
          select: sellerProfileOwnerSelect,
        });
      });

      return toSellerProfileResponse(sellerProfile);
    } catch (error: unknown) {
      if (isPrismaUniqueConstraintError(error)) {
        throwSellerProfileUniqueConflict(
          error,
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

      const prepared = profilePhoto
        ? await this.preparePhoto(userId, profilePhoto, 'AUTHOR_PHOTO')
        : undefined;
      if (prepared) profilePhoto = prepared.photo;
      const sellerProfile = await runReadCommittedTransaction(
        this.prisma,
        async (tx) => {
          const editing = await ensureEditableEditingRevision(tx, userId);
          if (this.media?.enabled)
            await this.media.assertNotPending(tx, {
              profileId: editing.profileId,
            });
          const profilePhotoData = profilePhoto
            ? {
                profilePhotoMimeType: profilePhoto.mimeType,
                profilePhotoByteLength: profilePhoto.buffer.byteLength,
                profilePhotoChecksum: createHash('sha256')
                  .update(profilePhoto.buffer)
                  .digest('hex'),
                profilePhotoObjectKey:
                  prepared?.asset?.preview.objectKey ??
                  imageKey.sellerProfileRevision(editing.revisionId),
                ...(prepared?.asset
                  ? { profilePhotoAssetId: prepared.asset.id }
                  : {}),
              }
            : {};
          await tx.sellerProfileRevision.update({
            where: { id: editing.revisionId },
            data: {
              ...publicProfileRevisionData(input),
              ...profilePhotoData,
            },
          });
          if (input.directionCategoryIds) {
            await replaceProfileDirections(
              tx,
              editing.revisionId,
              input.directionCategoryIds,
            );
          }
          if (prepared?.asset) await this.media!.attach(tx, prepared.asset.id);
          if (profilePhoto && !prepared?.asset) {
            await this.imageStore.put(
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

    const { directionCategoryIds: _directions, ...profileInput } = input;
    void _directions;
    const data = Object.fromEntries(
      Object.entries(profileInput).filter(([, value]) => value !== undefined),
    ) as Prisma.SellerProfileUncheckedUpdateInput;

    const prepared = profilePhoto
      ? await this.preparePhoto(userId, profilePhoto, 'AUTHOR_PHOTO')
      : undefined;
    if (prepared) profilePhoto = prepared.photo;
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
                profilePhotoObjectKey:
                  prepared?.asset?.preview.objectKey ??
                  imageKey.sellerPhoto(editing.profileId),
                ...(prepared?.asset
                  ? { profilePhotoAssetId: prepared.asset.id }
                  : {}),
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
          if (input.directionCategoryIds) {
            await replaceProfileDirections(
              tx,
              editing.revisionId,
              input.directionCategoryIds,
            );
          }
          if (prepared?.asset) await this.media!.attach(tx, prepared.asset.id);
          if (profilePhoto && !prepared?.asset) {
            await this.imageStore.put(
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
          throwSellerProfileUniqueConflict(
            error,
            'Seller profile could not be saved',
          );
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
      if (!revision)
        throw new NotFoundException('Seller profile revision not found');
      const directionCount = await tx.sellerProfileRevisionDirection.count({
        where: { revisionId: revision.id },
      });
      assertProfileRevisionReadyToSubmit({ ...revision, directionCount });
      await tx.sellerProfileRevision.update({
        where: { id: revision.id },
        data: { status: 'PENDING_REVIEW', submittedAt: new Date() },
      });
      if (profile.status !== 'APPROVED') {
        await tx.sellerProfile.update({
          where: { id: profile.id },
          data: { status: 'PENDING_REVIEW', applicationStage: null },
        });
      }
      return tx.sellerProfile.findUniqueOrThrow({
        where: { id: profile.id },
        select: sellerProfileOwnerSelect,
      });
    }).then(toSellerProfileResponse);
  }

  async advanceApplicationStage(userId: string) {
    return runReadCommittedTransaction(this.prisma, async (tx) => {
      const editing = await ensureEditableEditingRevision(tx, userId);
      const profile = await tx.sellerProfile.findUniqueOrThrow({
        where: { id: editing.profileId },
        include: { editingRevision: true },
      });
      if (profile.status !== 'DRAFT' || !profile.editingRevision) {
        throw new ConflictException('Author onboarding is not active');
      }
      const stage = profile.applicationStage;
      if (stage === 'CONTACTS') {
        await tx.sellerProfile.update({
          where: { id: profile.id },
          data: { applicationStage: 'ABOUT' },
        });
      } else if (stage === 'ABOUT') {
        const revision = profile.editingRevision;
        const directionCount = await tx.sellerProfileRevisionDirection.count({
          where: { revisionId: revision.id },
        });
        if (directionCount < 1 || !revision.shortDescription) {
          throw new ConflictException(
            'Author profile is missing required fields',
          );
        }
        await tx.sellerProfile.update({
          where: { id: profile.id },
          data: { applicationStage: 'ACHIEVEMENTS' },
        });
      } else {
        throw new ConflictException('Author onboarding cannot advance');
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
  ) {
    return runReadCommittedTransaction(this.prisma, async (tx) => {
      const editing = await ensureEditableEditingRevision(tx, userId);
      const last = await tx.sellerProfileRevisionAchievement.findFirst({
        where: { revisionId: editing.revisionId },
        select: { position: true },
        orderBy: { position: 'desc' },
      });
      const position = (last?.position ?? -1) + 1;
      // Date.UTC treats years 1..99 as 1901..1999. Set the full year explicitly.
      const occurredAt = new Date(0);
      occurredAt.setUTCFullYear(
        input.occurredDate.year,
        input.occurredDate.month - 1,
        input.occurredDate.day ?? 1,
      );
      const achievement = await tx.sellerProfileRevisionAchievement.create({
        data: {
          revisionId: editing.revisionId,
          position,
          occurredAt,
          occurredAtPrecision:
            input.occurredDate.day === null ? 'MONTH' : 'DAY',
          body: input.body,
        },
      });
      return portfolioAchievementResponseSchema.parse({
        achievement: {
          id: achievement.id,
          occurredDate: {
            year: input.occurredDate.year,
            month: input.occurredDate.month,
            day: input.occurredDate.day,
          },
          body: achievement.body,
          image: null,
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
            select: { id: true, objectKey: true, mediaAssetId: true },
          },
        );
        if (!achievement) {
          throw new NotFoundException('Achievement not found');
        }
        await tx.sellerProfileRevisionAchievement.delete({
          where: { id: achievement.id },
        });

        // Reindex on every delete, including legacy media-backed achievements.
        const remaining = await tx.sellerProfileRevisionAchievement.findMany({
          where: { revisionId: editing.revisionId },
          select: { id: true, position: true },
          orderBy: { position: 'asc' },
        });
        const temporaryBase = (remaining.at(-1)?.position ?? -1) + 1;
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

        if (achievement.mediaAssetId && this.media?.enabled) {
          // Forked revisions can still reference the same historical asset.
          const references = await tx.sellerProfileRevisionAchievement.count({
            where: { mediaAssetId: achievement.mediaAssetId },
          });
          if (references === 0) {
            await this.media.enqueueCleanup(tx, [achievement.mediaAssetId]);
          }
          return null;
        }
        if (!achievement.objectKey) return null;
        const references = await tx.sellerProfileRevisionAchievement.count({
          where: { objectKey: achievement.objectKey },
        });
        return references === 0 ? achievement.objectKey : null;
      },
    );
    if (objectKeyToDelete) {
      try {
        await this.imageStore.delete(objectKeyToDelete);
      } catch (error) {
        const location = safeFailureLocation(error);
        this.logger.warn(
          location
            ? `Failed to delete unreferenced achievement image at=${location}`
            : 'Failed to delete unreferenced achievement image',
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
            profilePhotoAssetId: true,
          },
        },
      },
    });
    if (!sellerProfile?.editingRevision?.profilePhotoObjectKey) {
      throw new NotFoundException('Seller profile photo not found');
    }
    const stored =
      sellerProfile.editingRevision.profilePhotoAssetId && this.media?.enabled
        ? await this.media.readPreview(
            sellerProfile.editingRevision.profilePhotoAssetId,
          )
        : await this.imageStore.get(
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
          mediaAssetId: true,
          revision: {
            select: {
              sellerProfile: {
                select: {
                  userId: true,
                  status: true,
                  publishedRevisionId: true,
                  user: { select: { status: true } },
                },
              },
            },
          },
        },
      });
    if (!achievement?.mimeType) {
      throw new NotFoundException('Achievement image not found');
    }
    const profile = achievement.revision.sellerProfile;
    const isPublic =
      profile.status === 'APPROVED' &&
      profile.user.status === 'active' &&
      profile.publishedRevisionId === achievement.revisionId;
    if (profile.userId !== userId && role !== 'admin' && !isPublic) {
      throw new NotFoundException('Achievement image not found');
    }
    const stored =
      achievement.mediaAssetId && this.media?.enabled
        ? await this.media.readPreview(achievement.mediaAssetId)
        : await this.imageStore.get(
            achievement.objectKey ?? imageKey.sellerAchievement(achievementId),
          );
    if (stored) {
      return { mimeType: stored.mimeType, data: stored.bytes, isPublic };
    }
    // Load legacy inline bytes only after authorization and a storage miss.
    const legacy = await this.prisma.sellerProfileRevisionAchievement.findUnique({
      where: { id: achievementId },
      select: { data: true },
    });
    if (!legacy?.data?.byteLength) {
      throw new NotFoundException('Achievement image not found');
    }
    return {
      mimeType: achievement.mimeType,
      data: legacy.data,
      isPublic,
    };
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
    const story = storyFromRows(product.editingRevision);

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
      ...(product.mediaOperations[0] ? { publication: product.mediaOperations[0] } : {}),
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
      story,
      selection: selectionFromRevision(product.editingRevision),
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
      where: {
        id: { in: pageRows.map((row) => row.id) },
        status: 'APPROVED',
        user: { status: 'active' },
        ...(options.requireCity ? { city: publicAuthorCityWhere } : {}),
      },
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
    const cte = publicAuthorCte({ page: 1, limit: 1, sort: 'added' });
    const [cities, tags] = await Promise.all([
      this.prisma.$queryRaw<Array<{ city: string | null }>>(
        Prisma.sql`${cte}
          SELECT DISTINCT "city"
          FROM filtered`,
      ),
      this.prisma.$queryRaw<Array<{ tag: string }>>(
        Prisma.sql`${cte}
          SELECT DISTINCT direction."category_id"::text AS "tag"
          FROM filtered
          INNER JOIN "seller_profile_revision_directions" direction
            ON direction."revision_id" = filtered."published_revision_id"`,
      ),
    ]);
    return {
      cities: cities.map((row) => row.city),
      tags: tags.map((row) => row.tag),
    };
  }

  async getApprovedPublicAuthor(
    slug: string,
    options: { requireCity?: boolean } = {},
  ) {
    const sellerProfile = await this.prisma.sellerProfile.findFirst({
      where: {
        status: 'APPROVED',
        user: { status: 'active' },
        OR: [{ user: { slug } }, { slug, user: { slug: null } }],
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
      where: {
        OR: [{ user: { slug } }, { slug, user: { slug: null } }],
      },
      select: sellerProfilePhotoSelect,
    });

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    const isOwner = sellerProfile.userId === userId;
    const isAdmin = role === 'admin';
    const isPublic = sellerProfile.status === 'APPROVED' && sellerProfile.user.status === 'active';

    if (!isOwner && !isAdmin && !isPublic) {
      throw new NotFoundException('Seller profile not found');
    }

    const stored =
      sellerProfile.profilePhotoAssetId && this.media?.enabled
        ? await this.media.readPreview(sellerProfile.profilePhotoAssetId)
        : await this.imageStore.get(
            sellerProfile.profilePhotoObjectKey ??
              imageKey.sellerPhoto(sellerProfile.id),
          );

    if (!stored) {
      throw new NotFoundException('Seller profile not found');
    }

    return {
      status: sellerProfile.status,
      isPublic,
      profilePhotoMimeType: stored.mimeType,
      profilePhotoData: stored.bytes,
    };
  }
}
