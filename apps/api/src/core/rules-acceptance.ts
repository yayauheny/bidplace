import { type Prisma } from '@bidplace/database';

export const latestRulesAcceptanceSelect = {
  rulesVersion: true,
  acceptedAt: true,
} satisfies Prisma.TermsAcceptanceSelect;

export function getAcceptedRulesVersion(
  record: { termsAcceptances?: Array<{ rulesVersion: string }> } | null | undefined,
): string | null {
  return record?.termsAcceptances?.[0]?.rulesVersion ?? null;
}
