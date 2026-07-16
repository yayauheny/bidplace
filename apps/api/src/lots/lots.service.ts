import {
  type PaginationQuery,
  type LotCreateRequest,
  type LotResponse,
  lotResponseSchema,
  sellerLotListResponseSchema,
} from '@bidplace/contracts';
import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { type RawLotRecord, toContractLot } from './lot.mapper';
import { parseSellerStatus } from '../core/contracts';
import { PrismaService } from '../core/database';

export interface LotsRepository {
  sellerProfile: {
    findUnique: PrismaService['sellerProfile']['findUnique'];
  };
  category: {
    findUnique: PrismaService['category']['findUnique'];
  };
  lot: {
    findMany: PrismaService['lot']['findMany'];
    create: PrismaService['lot']['create'];
  };
}

@Injectable()
export class LotsService {
  constructor(@Inject(PrismaService) private readonly prisma: LotsRepository) {}

  async listMyLots(userId: string, { page, limit }: PaginationQuery = { page: 1, limit: 20 }) {
    const sellerProfile = await this.prisma.sellerProfile.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    const lots = (await this.prisma.lot.findMany({
      where: {
        sellerProfileId: sellerProfile.id,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    })) as RawLotRecord[];

    return sellerLotListResponseSchema.parse({
      lots: lots.map((lot) => toContractLot(lot)),
    });
  }

  async createLot(
    userId: string,
    input: LotCreateRequest,
    images: readonly string[],
  ): Promise<LotResponse> {
    const sellerProfile = (await this.prisma.sellerProfile.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        status: true,
      },
    })) as { id: string; status: string } | null;

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    if (parseSellerStatus(sellerProfile.status, sellerProfile.id) !== 'active') {
      throw new ForbiddenException('Seller profile is not active');
    }

    const category = await this.prisma.category.findUnique({
      where: {
        id: input.categoryId,
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const lot = (await this.prisma.lot.create({
      data: {
        sellerProfileId: sellerProfile.id,
        categoryId: category.id,
        title: input.title,
        description: input.description,
        condition: input.condition,
        images: [...images],
        status: 'draft',
      },
    })) as RawLotRecord;

    return lotResponseSchema.parse({
      lot: toContractLot(lot),
    });
  }
}
