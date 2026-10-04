import { Prisma, PrismaClient } from './generated/prisma/client';

export { Prisma, PrismaClient };
export type Decimal = InstanceType<typeof Prisma.Decimal>;
export const Decimal = Prisma.Decimal;

export type {
  MediaAsset,
  MediaObject,
  MediaOperation,
  MediaPurpose,
  MediaTier,
} from './generated/prisma/client';
