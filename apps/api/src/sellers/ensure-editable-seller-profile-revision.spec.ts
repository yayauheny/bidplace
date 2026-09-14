import { describe, expect, it, vi } from 'vitest';

import {
  ensureEditableEditingRevision,
  resolveEditingAchievementId,
} from './ensure-editable-seller-profile-revision';

function publishedRevision() {
  return {
    id: 'published-revision-id',
    version: 1,
    slug: 'seller-slug',
    discipline: 'Керамика',
    fullName: 'Seller',
    country: 'BY',
    city: 'Minsk',
    practice: null,
    biography: null,
    socialLink: 'https://example.com/seller',
    telegramUrl: null,
    instagramUrl: null,
    websiteUrl: null,
    shortDescription: 'Description',
    profilePhotoMimeType: 'image/jpeg',
    profilePhotoByteLength: 8,
    profilePhotoChecksum: 'b'.repeat(64),
    profilePhotoObjectKey: 'seller-photo:seller-profile-id',
    achievements: [
      {
        id: 'published-achievement-id',
        position: 0,
        occurredAt: new Date('2025-01-02T00:00:00.000Z'),
        body: 'First exhibition',
        mimeType: 'image/png',
        byteLength: 12,
        checksum: 'a'.repeat(64),
        objectKey: 'achievement:one',
        data: Buffer.from('png'),
      },
    ],
  };
}

describe('ensureEditableEditingRevision', () => {
  it('reuses a draft editing revision without copying the published page', async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'seller-profile-id' }]),
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'seller-profile-id',
          status: 'APPROVED',
          editingRevisionId: 'draft-revision-id',
          publishedRevisionId: 'published-revision-id',
          editingRevision: { id: 'draft-revision-id', status: 'DRAFT' },
          publishedRevision: publishedRevision(),
        }),
        update: vi.fn(),
      },
      sellerProfileRevision: {
        create: vi.fn(),
      },
      sellerProfileRevisionAchievement: {
        create: vi.fn(),
        findFirst: vi.fn(),
      },
    };

    await expect(
      ensureEditableEditingRevision(tx as never, 'user-id'),
    ).resolves.toEqual({
      profileId: 'seller-profile-id',
      revisionId: 'draft-revision-id',
      achievementIdByPublishedId: new Map(),
    });
    expect(tx.sellerProfileRevision.create).not.toHaveBeenCalled();
    expect(tx.sellerProfileRevisionAchievement.create).not.toHaveBeenCalled();
    expect(tx.sellerProfile.update).not.toHaveBeenCalled();
    expect(tx.$queryRaw).toHaveBeenCalledTimes(2);
  });

  it('forks an approved published revision and maps each created draft achievement id', async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'seller-profile-id' }]),
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'seller-profile-id',
          status: 'APPROVED',
          editingRevisionId: 'published-revision-id',
          publishedRevisionId: 'published-revision-id',
          editingRevision: { id: 'published-revision-id', status: 'APPROVED' },
          publishedRevision: publishedRevision(),
        }),
        update: vi.fn(),
      },
      sellerProfileRevision: {
        create: vi.fn().mockResolvedValue({ id: 'draft-revision-id' }),
      },
      sellerProfileRevisionAchievement: {
        create: vi.fn().mockResolvedValue({ id: 'draft-achievement-id' }),
      },
    };

    const result = await ensureEditableEditingRevision(tx as never, 'user-id');

    expect(result).toEqual({
      profileId: 'seller-profile-id',
      revisionId: 'draft-revision-id',
      achievementIdByPublishedId: new Map([
        ['published-achievement-id', 'draft-achievement-id'],
      ]),
    });
    expect(tx.sellerProfileRevision.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sellerProfileId: 'seller-profile-id',
        status: 'DRAFT',
        profilePhotoObjectKey: 'seller-photo:seller-profile-id',
      }),
    });
    expect(
      tx.sellerProfileRevision.create.mock.calls[0]?.[0]?.data?.achievements,
    ).toBeUndefined();
    expect(tx.sellerProfileRevisionAchievement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        revisionId: 'draft-revision-id',
        position: 0,
        body: 'First exhibition',
        objectKey: 'achievement:one',
        data: Buffer.from('png'),
      }),
    });
    expect(tx.sellerProfile.update).toHaveBeenCalledWith({
      where: { id: 'seller-profile-id' },
      data: { editingRevisionId: 'draft-revision-id' },
    });
  });

  it('rejects edits while a revision is pending review', async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'seller-profile-id' }]),
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'seller-profile-id',
          status: 'PENDING_REVIEW',
          editingRevisionId: 'pending-revision-id',
          publishedRevisionId: null,
          editingRevision: {
            id: 'pending-revision-id',
            status: 'PENDING_REVIEW',
          },
          publishedRevision: null,
        }),
        update: vi.fn(),
      },
      sellerProfileRevision: {
        create: vi.fn(),
      },
    };

    await expect(
      ensureEditableEditingRevision(tx as never, 'user-id'),
    ).rejects.toThrow('Seller profile revision is locked');
    expect(tx.sellerProfileRevision.create).not.toHaveBeenCalled();
  });

  it('rejects edits of a suspended seller profile', async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'seller-profile-id' }]),
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'seller-profile-id',
          status: 'SUSPENDED',
          editingRevisionId: 'published-revision-id',
          publishedRevisionId: 'published-revision-id',
          editingRevision: { id: 'published-revision-id', status: 'APPROVED' },
          publishedRevision: publishedRevision(),
        }),
      },
      sellerProfileRevision: {
        create: vi.fn(),
      },
    };

    await expect(
      ensureEditableEditingRevision(tx as never, 'user-id'),
    ).rejects.toThrow('Seller profile is suspended');
    expect(tx.sellerProfileRevision.create).not.toHaveBeenCalled();
  });

  it('resolves a published achievement id only from the fork map', async () => {
    const tx = {
      sellerProfileRevisionAchievement: {
        findFirst: vi.fn(),
      },
    };

    await expect(
      resolveEditingAchievementId(
        tx as never,
        {
          profileId: 'seller-profile-id',
          revisionId: 'draft-revision-id',
          achievementIdByPublishedId: new Map([
            ['published-achievement-id', 'draft-achievement-id'],
          ]),
        },
        'published-achievement-id',
      ),
    ).resolves.toBe('draft-achievement-id');
    expect(
      tx.sellerProfileRevisionAchievement.findFirst,
    ).not.toHaveBeenCalled();
  });

  it('accepts an achievement id that already belongs to the editing revision', async () => {
    const tx = {
      sellerProfileRevisionAchievement: {
        findFirst: vi.fn().mockResolvedValue({ id: 'draft-achievement-id' }),
      },
    };

    await expect(
      resolveEditingAchievementId(
        tx as never,
        {
          profileId: 'seller-profile-id',
          revisionId: 'draft-revision-id',
          achievementIdByPublishedId: new Map(),
        },
        'draft-achievement-id',
      ),
    ).resolves.toBe('draft-achievement-id');
    expect(tx.sellerProfileRevisionAchievement.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'draft-achievement-id',
        revisionId: 'draft-revision-id',
      },
      select: { id: true },
    });
  });

  it('does not guess a draft copy from published achievement content', async () => {
    const tx = {
      sellerProfileRevisionAchievement: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn(),
      },
    };

    await expect(
      resolveEditingAchievementId(
        tx as never,
        {
          profileId: 'seller-profile-id',
          revisionId: 'draft-revision-id',
          achievementIdByPublishedId: new Map(),
        },
        'published-achievement-id',
      ),
    ).rejects.toThrow('Achievement not found');
    expect(tx.sellerProfileRevisionAchievement.findMany).not.toHaveBeenCalled();
  });
});
