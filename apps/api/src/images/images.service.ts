import {
  lotResponseSchema,
  type AuthTokenPayload,
  type LotImageReorderRequest,
  type LotResponse,
} from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { lotContractSelect, toContractLot } from '../lots/lot.mapper';
import { parseLotStatus } from '../core/contracts';
import { PrismaService } from '../core/database';

const imageReadSelect = {
  id: true,
  mimeType: true,
  byteLength: true,
  data: true,
  checksum: true,
  lot: {
    select: {
      id: true,
      status: true,
      sellerProfile: {
        select: {
          userId: true,
        },
      },
    },
  },
} as const;

type ImageReadRecord = Prisma.LotImageGetPayload<{
  select: typeof imageReadSelect;
}>;

const lotImageOrderBy = [{ position: 'asc' as const }, { id: 'asc' as const }];

const imageMutationSelect = {
  id: true,
  lotId: true,
  position: true,
  lot: {
    select: {
      id: true,
      status: true,
      sellerProfile: {
        select: {
          userId: true,
        },
      },
      lotImages: {
        select: {
          id: true,
          position: true,
        },
        orderBy: lotImageOrderBy,
      },
    },
  },
};

const lotImageManagementSelect = {
  id: true,
  status: true,
  sellerProfile: {
    select: {
      userId: true,
    },
  },
  lotImages: {
    select: {
      id: true,
      position: true,
    },
    orderBy: lotImageOrderBy,
  },
};

type LotImageManagementRecord = Prisma.LotGetPayload<{
  select: typeof lotImageManagementSelect;
}>;

export type ImageResponse = {
  data: Buffer;
  mimeType: string;
  byteLength: number;
  checksum: string;
  isPublic: boolean;
};

export interface ImagesRepository {
  lot: {
    findUnique: PrismaService['lot']['findUnique'];
  };
  lotImage: {
    findUnique: PrismaService['lotImage']['findUnique'];
    update: PrismaService['lotImage']['update'];
    updateMany: PrismaService['lotImage']['updateMany'];
    delete: PrismaService['lotImage']['delete'];
  };
  $transaction: PrismaService['$transaction'];
}

@Injectable()
export class ImagesService {
  constructor(@Inject(PrismaService) private readonly prisma: ImagesRepository) {}

  async getImage(
    imageId: string,
    auth?: AuthTokenPayload,
  ): Promise<ImageResponse> {
    const image = await this.prisma.lotImage.findUnique({
      where: {
        id: imageId,
      },
      select: imageReadSelect,
    });

    if (!image || !this.canReadImage(image, auth)) {
      throw new NotFoundException('Image not found');
    }

    return {
      data: Buffer.from(image.data),
      mimeType: image.mimeType,
      byteLength: image.byteLength,
      checksum: image.checksum,
      isPublic: parseLotStatus(image.lot.status, image.lot.id) === 'published',
    };
  }

  async deleteLotImage(
    auth: AuthTokenPayload,
    lotId: string,
    imageId: string,
  ): Promise<LotResponse> {
    const image = await this.getManagedLotImage(lotId, imageId);
    this.assertLotManagementAccess(image.lot, auth);

    await this.deleteLotImageAndCompactPositions(image);

    return this.getLotResponse(lotId);
  }

  async reorderLotImages(
    auth: AuthTokenPayload,
    lotId: string,
    input: LotImageReorderRequest,
  ): Promise<LotResponse> {
    const lot = await this.getManageableLot(lotId);
    this.assertLotManagementAccess(lot, auth);
    this.assertReorderMatchesLotImages(lot, input.imageIds);
    await this.applyLotImageOrder(input.imageIds, lot.lotImages.length);

    return this.getLotResponse(lotId);
  }

  private async getManagedLotImage(
    lotId: string,
    imageId: string,
  ) {
    const image = await this.prisma.lotImage.findUnique({
      where: {
        id: imageId,
      },
      select: imageMutationSelect,
    });

    if (!image || image.lotId !== lotId) {
      throw new NotFoundException('Image not found');
    }

    return image;
  }

  private async getManageableLot(lotId: string): Promise<LotImageManagementRecord> {
    const lot = await this.prisma.lot.findUnique({
      where: {
        id: lotId,
      },
      select: lotImageManagementSelect,
    });

    if (!lot) {
      throw new NotFoundException('Lot not found');
    }

    return lot;
  }

  private async deleteLotImageAndCompactPositions(
    image: Prisma.LotImageGetPayload<{ select: typeof imageMutationSelect }>,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.lotImage.delete({
        where: {
          id: image.id,
        },
      });

      await tx.lotImage.updateMany({
        where: {
          lotId: image.lotId,
          position: {
            gt: image.position,
          },
        },
        data: {
          position: {
            decrement: 1,
          },
        },
      });
    });
  }

  private async applyLotImageOrder(
    imageIds: readonly string[],
    imageCount: number,
  ): Promise<void> {
    const positionOffset = imageCount;

    await this.prisma.$transaction(async (tx) => {
      for (const [index, imageId] of imageIds.entries()) {
        await tx.lotImage.update({
          where: {
            id: imageId,
          },
          data: {
            position: positionOffset + index,
          },
        });
      }

      for (const [index, imageId] of imageIds.entries()) {
        await tx.lotImage.update({
          where: {
            id: imageId,
          },
          data: {
            position: index,
          },
        });
      }
    });
  }

  private async getLotResponse(lotId: string): Promise<LotResponse> {
    const lot = await this.prisma.lot.findUnique({
      where: {
        id: lotId,
      },
      select: lotContractSelect,
    });

    if (!lot) {
      throw new NotFoundException('Lot not found');
    }

    return lotResponseSchema.parse({
      lot: toContractLot(lot),
    });
  }

  private canReadImage(
    image: ImageReadRecord,
    auth?: AuthTokenPayload,
  ): boolean {
    if (parseLotStatus(image.lot.status, image.lot.id) === 'published') {
      return true;
    }

    if (!auth) {
      return false;
    }

    if (auth.role === 'admin') {
      return true;
    }

    return image.lot.sellerProfile.userId === auth.sub;
  }

  private assertLotManagementAccess(
    lot: Pick<LotImageManagementRecord, 'id' | 'status' | 'sellerProfile'>,
    auth: AuthTokenPayload,
  ): void {
    parseLotStatus(lot.status, lot.id);

    if (auth.role === 'admin') {
      return;
    }

    if (lot.sellerProfile.userId !== auth.sub) {
      throw new NotFoundException('Lot not found');
    }
  }

  private assertReorderMatchesLotImages(
    lot: LotImageManagementRecord,
    imageIds: readonly string[],
  ): void {
    const currentImageIds = lot.lotImages.map((image) => image.id);

    if (currentImageIds.length === 0) {
      throw new BadRequestException('Lot has no images');
    }

    if (currentImageIds.length !== imageIds.length) {
      throw new BadRequestException(
        'Image reorder payload must include every lot image exactly once',
      );
    }

    const currentImageIdSet = new Set(currentImageIds);

    if (imageIds.some((imageId) => !currentImageIdSet.has(imageId))) {
      throw new BadRequestException(
        'Image reorder payload must include every lot image exactly once',
      );
    }
  }
}
