import type { PaginationQuery } from '@bidplace/contracts';
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../core/database';
import { toPortfolioWorkItem } from '../portfolio/portfolio.service';
import { portfolioCatalogProductSelect } from '../products/products.mapper';
import { ProductsService } from '../products/products.service';
import { portfolioCatalogProductWhere } from '../products/public-visibility';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly products: ProductsService,
  ) {}

  async list(userId: string, query: PaginationQuery) {
    const where = {
      userId,
      product: portfolioCatalogProductWhere,
    };
    const [rows, total] = await Promise.all([
      this.prisma.favoriteWork.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { productId: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: { product: { select: portfolioCatalogProductSelect } },
      }),
      this.prisma.favoriteWork.count({ where }),
    ]);
    const works = [];
    for (const row of rows) {
      const item = this.products.toPortfolioItem(row.product);
      if (item) works.push(toPortfolioWorkItem(item));
    }
    return {
      works,
      pagination: { page: query.page, limit: query.limit, total },
    };
  }

  async add(userId: string, productId: string): Promise<void> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, ...portfolioCatalogProductWhere },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Work not found');
    await this.prisma.favoriteWork.createMany({
      data: [{ userId, productId }],
      skipDuplicates: true,
    });
  }

  async remove(userId: string, productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Work not found');
    await this.prisma.favoriteWork.deleteMany({
      where: { userId, productId },
    });
  }
}
