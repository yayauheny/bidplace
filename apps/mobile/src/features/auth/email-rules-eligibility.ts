export type EmailRulesEligibility =
  | 'loading'
  | 'guest'
  | 'admin'
  | 'email'
  | 'rules'
  | 'ready'
  | 'error';

export function resolveEmailRulesEligibility(input: {
  ready: boolean;
  authenticated: boolean;
  admin: boolean;
  user: {
    emailVerifiedAt: string | null;
    acceptedRulesVersion: string | null;
  } | null;
  rulesVersion: string | null;
  rulesLoading: boolean;
  rulesError: boolean;
}): EmailRulesEligibility {
  if (!input.ready) return 'loading';
  if (!input.authenticated) return 'guest';
  if (input.admin) return 'admin';
  if (!input.user) return 'error';
  if (!input.user.emailVerifiedAt) return 'email';
  if (input.rulesError) return 'error';
  if (input.rulesLoading || !input.rulesVersion) return 'loading';
  return input.user.acceptedRulesVersion === input.rulesVersion
    ? 'ready'
    : 'rules';
}
