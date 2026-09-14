import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@bidplace/database';

import {
  lockSellerProfileRevisionRowForUpdate,
  lockSellerProfileRowForUpdate,
} from './seller-profile-revision-lock';
import { canAuthorEditSellerProfileRevision } from './seller-profile-revision-state';

export type EditableEditingRevision = {
  profileId: string;
  revisionId: string;
  achievementIdByPublishedId: ReadonlyMap<string, string>;
};

export async function ensureEditableEditingRevision(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<EditableEditingRevision> {
  const profileId = await lockSellerProfileRowForUpdate(tx, userId);
  const profile = await tx.sellerProfile.findUnique({
    where: { id: profileId },
    include: {
      editingRevision: true,
      publishedRevision: {
        include: {
          achievements: { orderBy: { position: 'asc' } },
        },
      },
    },
  });
  if (!profile?.editingRevision) {
    throw new NotFoundException('Seller profile revision not found');
  }
  if (profile.status === 'SUSPENDED') {
    throw new ForbiddenException('Seller profile is suspended');
  }

  const editing = profile.editingRevision;
  if (canAuthorEditSellerProfileRevision(editing.status)) {
    await lockSellerProfileRevisionRowForUpdate(tx, editing.id);
    return {
      profileId: profile.id,
      revisionId: editing.id,
      achievementIdByPublishedId: new Map(),
    };
  }

  const canForkPublished =
    profile.status === 'APPROVED' &&
    editing.status === 'APPROVED' &&
    profile.editingRevisionId === profile.publishedRevisionId;
  if (!canForkPublished) {
    throw new ConflictException('Seller profile revision is locked');
  }
  if (!profile.publishedRevision) {
    throw new ConflictException('Published profile revision is missing');
  }

  const published = profile.publishedRevision;
  const draft = await tx.sellerProfileRevision.create({
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
      biography: published.biography,
      socialLink: published.socialLink,
      telegramUrl: published.telegramUrl,
      instagramUrl: published.instagramUrl,
      websiteUrl: published.websiteUrl,
      shortDescription: published.shortDescription,
      profilePhotoMimeType: published.profilePhotoMimeType,
      profilePhotoByteLength: published.profilePhotoByteLength,
      profilePhotoChecksum: published.profilePhotoChecksum,
      profilePhotoObjectKey: published.profilePhotoObjectKey,
    },
  });
  await tx.sellerProfile.update({
    where: { id: profile.id },
    data: { editingRevisionId: draft.id },
  });
  await lockSellerProfileRevisionRowForUpdate(tx, draft.id);

  const achievementIdByPublishedId = new Map<string, string>();
  for (const source of published.achievements) {
    const copy = await tx.sellerProfileRevisionAchievement.create({
      data: {
        revisionId: draft.id,
        position: source.position,
        occurredAt: source.occurredAt,
        body: source.body,
        mimeType: source.mimeType,
        byteLength: source.byteLength,
        checksum: source.checksum,
        objectKey: source.objectKey,
        data: source.data,
      },
    });
    achievementIdByPublishedId.set(source.id, copy.id);
  }

  return {
    profileId: profile.id,
    revisionId: draft.id,
    achievementIdByPublishedId,
  };
}

export async function resolveEditingAchievementId(
  tx: Prisma.TransactionClient,
  editing: EditableEditingRevision,
  achievementId: string,
): Promise<string> {
  const mapped = editing.achievementIdByPublishedId.get(achievementId);
  if (mapped) {
    return mapped;
  }

  const onEditing = await tx.sellerProfileRevisionAchievement.findFirst({
    where: { id: achievementId, revisionId: editing.revisionId },
    select: { id: true },
  });
  if (onEditing) {
    return onEditing.id;
  }

  throw new NotFoundException('Achievement not found');
}
