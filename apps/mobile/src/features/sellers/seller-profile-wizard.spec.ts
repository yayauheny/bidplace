import { describe, expect, it } from 'vitest';

import { canOpenSellerProfileStep, previousSellerProfileStep, resolveSellerProfileStep, shouldAdvanceSellerApplication, shouldSaveBeforeSellerProfileBack, shouldShowSellerProfileAchievements } from './seller-profile-wizard';

describe('seller profile draft wizard', () => {
  it('keeps Step 1 for malformed and unpersisted Step 2 URLs', () => {
    expect(resolveSellerProfileStep('unexpected', null)).toBe(1);
    expect(resolveSellerProfileStep('2', null)).toBe(1);
  });

  it('keeps persisted drafts on Step 2 and does not relock it after returning to Step 1', () => {
    const draft = { status: 'DRAFT', applicationStage: 'CONTACTS' as const };
    expect(resolveSellerProfileStep('2', draft)).toBe(2);
    expect(canOpenSellerProfileStep(2, draft)).toBe(true);
  });

  it('resumes and clamps draft URLs at the server-owned onboarding boundary', () => {
    const contacts = { status: 'DRAFT', applicationStage: 'CONTACTS' as const };
    const about = { status: 'DRAFT', applicationStage: 'ABOUT' as const };
    const achievements = { status: 'DRAFT', applicationStage: 'ACHIEVEMENTS' as const };

    expect(resolveSellerProfileStep(undefined, contacts)).toBe(2);
    expect(resolveSellerProfileStep('4', contacts)).toBe(2);
    expect(resolveSellerProfileStep('4', about)).toBe(3);
    expect(resolveSellerProfileStep('1', about)).toBe(1);
    expect(resolveSellerProfileStep(undefined, achievements)).toBe(4);
    expect(resolveSellerProfileStep('4', { status: 'CHANGES_REQUESTED' })).toBe(4);
  });

  it('keeps achievements visible for an approved non-wizard profile', () => {
    expect(shouldShowSellerProfileAchievements(true, false, 1)).toBe(true);
    expect(shouldShowSellerProfileAchievements(true, true, 1)).toBe(false);
    expect(shouldShowSellerProfileAchievements(true, true, 4)).toBe(true);
  });

  it.each([
    [4, 3],
    [3, 2],
    [2, 1],
  ] as const)('maps internal Back from Step %i to Step %i', (step, expected) => {
    expect(previousSellerProfileStep(step)).toBe(expected);
  });

  it.each([
    [false, false, false],
    [true, false, true],
    [false, true, true],
  ] as const)('detects when Back must persist the profile form', (isDirty, hasPhotoChange, expected) => {
    expect(shouldSaveBeforeSellerProfileBack(isDirty, hasPhotoChange)).toBe(expected);
  });

  it.each([
    [{ status: 'DRAFT', applicationStage: 'ABOUT' as const }, 2, false],
    [{ status: 'DRAFT', applicationStage: 'ACHIEVEMENTS' as const }, 2, false],
    [{ status: 'DRAFT', applicationStage: 'ACHIEVEMENTS' as const }, 3, false],
    [{ status: 'CHANGES_REQUESTED', applicationStage: null }, 2, false],
    [{ status: 'REJECTED', applicationStage: null }, 3, false],
    [{ status: 'DRAFT', applicationStage: 'CONTACTS' as const }, 2, true],
    [{ status: 'DRAFT', applicationStage: 'ABOUT' as const }, 3, true],
  ] as const)('advances only the matching draft boundary for %o on Step %i', (profile, step, expected) => {
    expect(shouldAdvanceSellerApplication(profile, step)).toBe(expected);
  });
});
