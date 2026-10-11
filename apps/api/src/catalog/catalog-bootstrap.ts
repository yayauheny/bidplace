import { Prisma } from '@bidplace/database';

import { PrismaService } from '../core/database';
import {
  STARTER_CATEGORIES,
  STARTER_MATERIALS,
  STARTER_TECHNIQUES,
} from './catalog-data';

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export async function bootstrapCatalog(prisma: PrismaService): Promise<void> {
  for (const category of STARTER_CATEGORIES) {
    const existing = await prisma.category.findUnique({
      where: { slug: category.slug },
      select: { id: true },
    });
    if (existing) continue;
    try {
      await prisma.category.create({
        data: {
          slug: category.slug,
          name: category.name,
          description: category.description,
        },
      });
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
    }
  }

  const terms = [
    ...STARTER_MATERIALS.map(([slug, name]) => ({ role: 'MATERIAL' as const, slug, name })),
    ...STARTER_TECHNIQUES.map(([slug, name]) => ({ role: 'TECHNIQUE' as const, slug, name })),
  ];
  for (const term of terms) {
    const existing = await prisma.catalogTerm.findUnique({
      where: { role_slug: { role: term.role, slug: term.slug } },
      select: { id: true },
    });
    if (existing) continue;
    try {
      await prisma.catalogTerm.create({ data: term });
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
    }
  }
}
