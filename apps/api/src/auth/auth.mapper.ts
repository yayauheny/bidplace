import { type User as ContractUser } from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';

import { parseUserRole, parseUserStatus } from '../core/contracts';

export const authUserContractSelect = {
  id: true,
  email: true,
  phone: true,
  displayName: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
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
    displayName: user.displayName,
    role: parseUserRole(user.role, user.id),
    status: parseUserStatus(user.status, user.id),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
