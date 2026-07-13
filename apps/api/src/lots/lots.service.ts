import {
  type PaginationQuery,
  type Lot,
  type LotCreateRequest,
  type LotResponse,
  lotResponseSchema,
  sellerLotListResponseSchema,
} from '@bidplace/contracts';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../core/database';

type LotRecord = {
  id: string;
  sellerProfileId: string;
  categoryId: string;
  title: string;
  description: string;
  condition: string;
  images: string[];
  status: Lot['status'];
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class LotsService {
  constructor(private readonly prisma: PrismaService) {}

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
    })) as LotRecord[];

    return sellerLotListResponseSchema.parse({
      lots: lots.map((lot) => this.toContractLot(lot)),
    });
  }

  async createLot(
    userId: string,
    input: LotCreateRequest,
    images: readonly string[],
  ): Promise<LotResponse> {
    const sellerProfile = await this.prisma.sellerProfile.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    if (sellerProfile.status !== 'active') {
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

    const lot = await this.prisma.lot.create({
      data: {
        sellerProfileId: sellerProfile.id,
        categoryId: category.id,
        title: input.title,
        description: input.description,
        condition: input.condition,
        images: [...images],
        status: 'draft',
      },
    });

    return lotResponseSchema.parse({
      lot: this.toContractLot(lot),
    });
  }

  private toContractLot(lot: LotRecord): Lot {
    return {
      id: lot.id,
      sellerProfileId: lot.sellerProfileId,
      categoryId: lot.categoryId,
      title: lot.title,
      description: lot.description,
      condition: lot.condition,
      images: lot.images,
      status: lot.status,
      createdAt: lot.createdAt.toISOString(),
      updatedAt: lot.updatedAt.toISOString(),
    };
  }
}
