import { type User as ContractUser } from '@bidplace/contracts';

import { parseUserRole, parseUserStatus } from '../core/contracts';

export type RawAuthUserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  phone: string;
  displayName: string;
  role: string;
  status: string;
  sessionVersion: number;
  createdAt: Date;
  updatedAt: Date;
};

export function toContractUser(user: RawAuthUserRecord): ContractUser {
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
