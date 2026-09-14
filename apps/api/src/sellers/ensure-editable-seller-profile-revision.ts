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
          data: achievement.data,
        })),
      },
    },
  });
  await tx.sellerProfile.update({
    where: { id: profile.id },
    data: { editingRevisionId: draft.id },
  });
  await lockSellerProfileRevisionRowForUpdate(tx, draft.id);

  const copies = await tx.sellerProfileRevisionAchievement.findMany({
    where: { revisionId: draft.id },
    select: { id: true, position: true },
    orderBy: { position: 'asc' },
  });
  const achievementIdByPublishedId = new Map<string, string>();
  for (const source of published.achievements) {
    const copy = copies.find((item) => item.position === source.position);
    if (copy) {
      achievementIdByPublishedId.set(source.id, copy.id);
    }
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

  const profile = await tx.sellerProfile.findUnique({
    where: { id: editing.profileId },
    select: { publishedRevisionId: true },
  });
  if (
    !profile?.publishedRevisionId ||
    profile.publishedRevisionId === editing.revisionId
  ) {
    return achievementId;
  }

  const published = await tx.sellerProfileRevisionAchievement.findFirst({
    where: {
      id: achievementId,
      revisionId: profile.publishedRevisionId,
    },
    select: {
      position: true,
      body: true,
      occurredAt: true,
      objectKey: true,
    },
  });
  if (!published) {
    return achievementId;
  }

  const copies = await tx.sellerProfileRevisionAchievement.findMany({
    where: {
      revisionId: editing.revisionId,
      body: published.body,
      occurredAt: published.occurredAt,
      objectKey: published.objectKey,
    },
    select: { id: true, position: true },
    orderBy: { position: 'asc' },
  });
  if (copies.length === 1) {
    return copies[0]!.id;
  }
  return (
    copies.find((item) => item.position === published.position)?.id ??
    achievementId
  );
}
