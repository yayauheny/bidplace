import { categoryListResponseSchema } from '@bidplace/contracts';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../core/database';

type CategoryRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories() {
    const categories = (await this.prisma.category.findMany({
      orderBy: [{ name: 'asc' }, { slug: 'asc' }],
    })) as CategoryRecord[];

    return categoryListResponseSchema.parse({
      categories: categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.name,
        description: category.description,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
      })),
    });
  }
}
