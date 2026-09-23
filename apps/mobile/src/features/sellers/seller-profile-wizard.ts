export function resolveSellerProfileStep(
  requestedStep: string | string[] | undefined,
  hasPersistedDraft: boolean,
): 1 | 2 {
  return requestedStep === '2' && hasPersistedDraft ? 2 : 1;
}

export function canOpenSellerProfileStep(
  step: 1 | 2,
  hasPersistedDraft: boolean,
): boolean {
  return step === 1 || hasPersistedDraft;
}

export function shouldShowSellerProfileAchievements(
  hasProfile: boolean,
  isApplicationWizard: boolean,
  step: 1 | 2,
): boolean {
  return hasProfile && (!isApplicationWizard || step === 2);
}
