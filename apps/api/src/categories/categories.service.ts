import { categoryListResponseSchema } from '@bidplace/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../core/database';

type CategoryRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

export interface CategoriesRepository {
  category: {
    findMany: PrismaService['category']['findMany'];
  };
}

@Injectable()
export class CategoriesService {
  constructor(@Inject(PrismaService) private readonly prisma: CategoriesRepository) {}

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
      })),
    });
  }
}
