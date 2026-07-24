import { type User as ContractUser } from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';

import { parseUserRole, parseUserStatus } from '../core/contracts';
import {
  getAcceptedRulesVersion,
  latestRulesAcceptanceSelect,
} from '../core/rules-acceptance';

export const authUserContractSelect = {
  id: true,
  email: true,
  phone: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  displayName: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  termsAcceptances: {
    select: latestRulesAcceptanceSelect,
    orderBy: { acceptedAt: 'desc' },
    take: 1,
  },
} satisfies Prisma.UserSelect;

export type AuthUserContractRecord = Prisma.UserGetPayload<{
  select: typeof authUserContractSelect;
}>;

export const authCredentialsSelect = {
  ...authUserContractSelect,
  passwordHash: true,
  sessionVersion: true,
} satisfies Prisma.UserSelect;

export type AuthCredentialsRecord = Prisma.UserGetPayload<{
  select: typeof authCredentialsSelect;
}>;

export function toContractUser(user: AuthUserContractRecord): ContractUser {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    phoneVerifiedAt: user.phoneVerifiedAt?.toISOString() ?? null,
    acceptedRulesVersion: getAcceptedRulesVersion(user),
    displayName: user.displayName,
    role: parseUserRole(user.role, user.id),
    status: parseUserStatus(user.status, user.id),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
