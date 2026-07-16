import { Prisma, PrismaClient } from './generated/prisma/client';

export { Prisma, PrismaClient };
export type Decimal = InstanceType<typeof Prisma.Decimal>;
export const Decimal = Prisma.Decimal;
