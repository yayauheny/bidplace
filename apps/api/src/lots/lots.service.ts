import {
  type PaginationQuery,
  type LotCreateRequest,
  type LotResponse,
  lotResponseSchema,
  sellerLotListResponseSchema,
} from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';
import {
  createHash,
} from 'node:crypto';
import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { lotContractSelect, toContractLot } from './lot.mapper';
import { parseSellerStatus } from '../core/contracts';
import { PrismaService } from '../core/database';
import { type ValidatedImageUpload } from '../images/image-policy';

const sellerProfileStatusSelect = {
  id: true,
  status: true,
} satisfies Prisma.SellerProfileSelect;

type SellerProfileStatusRecord = Prisma.SellerProfileGetPayload<{
  select: typeof sellerProfileStatusSelect;
}>;

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

function createLotImageChecksum(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function toLotImageCreateData(
  image: ValidatedImageUpload,
  position: number,
): Prisma.LotImageUncheckedCreateWithoutLotInput {
  return {
    position,
    mimeType: image.mimeType,
    byteLength: image.buffer.byteLength,
    data: Uint8Array.from(image.buffer),
    checksum: createLotImageChecksum(image.buffer),
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

    const lots = await this.prisma.lot.findMany({
      where: {
        sellerProfileId: sellerProfile.id,
      },
      select: lotContractSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return sellerLotListResponseSchema.parse({
      lots: lots.map((lot) => toContractLot(lot)),
    });
  }

  async createLot(
    userId: string,
    input: LotCreateRequest,
    images: readonly ValidatedImageUpload[],
  ): Promise<LotResponse> {
    const sellerProfile: SellerProfileStatusRecord | null =
      await this.prisma.sellerProfile.findUnique({
      where: {
        userId,
      },
      select: sellerProfileStatusSelect,
    });

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

    const lotCreateData: Prisma.LotUncheckedCreateInput = {
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
      title: input.title,
      description: input.description,
      condition: input.condition,
      status: 'draft',
    };

    if (images.length > 0) {
      lotCreateData.lotImages = {
        create: images.map((image, index) => toLotImageCreateData(image, index)),
      };
    }

    const lot = await this.prisma.lot.create({
      data: lotCreateData,
      select: lotContractSelect,
    });

    return lotResponseSchema.parse({
      lot: toContractLot(lot),
    });
  }
}
