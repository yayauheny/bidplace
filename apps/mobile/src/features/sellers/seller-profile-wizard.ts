type ProfileState = {
  status: string;
  applicationStage?: 'CONTACTS' | 'ABOUT' | 'ACHIEVEMENTS' | null;
} | null | undefined;

export function resumeSellerProfileStep(profile: ProfileState): 1 | 2 | 3 | 4 {
  if (!profile) return 1;
  if (profile.status === 'CHANGES_REQUESTED' || profile.status === 'REJECTED') return 4;
  if (profile.status !== 'DRAFT') return 1;
  if (profile.applicationStage === 'ACHIEVEMENTS') return 4;
  if (profile.applicationStage === 'ABOUT') return 3;
  return 2;
}

export function resolveSellerProfileStep(
  requestedStep: string | string[] | undefined,
  profile: ProfileState,
): 1 | 2 | 3 | 4 {
  const resume = resumeSellerProfileStep(profile);
  const parsed = typeof requestedStep === 'string' ? Number(requestedStep) : NaN;
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 4) return resume;
  return Math.min(parsed, resume) as 1 | 2 | 3 | 4;
}

export function canOpenSellerProfileStep(
  step: 1 | 2 | 3 | 4,
  profile: ProfileState,
): boolean {
  return step <= resumeSellerProfileStep(profile);
}

export function shouldAdvanceSellerApplication(
  profile: ProfileState,
  visibleStep: 2 | 3,
): boolean {
  if (profile?.status !== 'DRAFT') return false;
  return (
    (visibleStep === 2 && profile.applicationStage === 'CONTACTS') ||
    (visibleStep === 3 && profile.applicationStage === 'ABOUT')
  );
}

export function shouldShowSellerProfileAchievements(
  hasProfile: boolean,
  isApplicationWizard: boolean,
  step: 1 | 2 | 3 | 4,
): boolean {
  return hasProfile && (!isApplicationWizard || step === 4);
}
