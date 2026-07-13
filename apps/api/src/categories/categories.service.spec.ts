import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CategoriesService, type CategoriesRepository } from './categories.service';

describe('CategoriesService', () => {
  const prisma = {
    category: {
      findMany: vi.fn(),
    },
  } satisfies CategoriesRepository;

  const service = new CategoriesService(prisma);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists categories in deterministic order', async () => {
    prisma.category.findMany.mockResolvedValue([
      {
        id: 'b8d7d079-f07e-4cd0-b1e2-1f3a8c1d8f5b',
        slug: 'art-object',
        name: 'Art Object',
        description: 'Curated art and collectible pieces for MVP demos.',
        createdAt: new Date('2026-07-13T10:00:00.000Z'),
        updatedAt: new Date('2026-07-13T10:00:00.000Z'),
      },
    ]);

    const result = await service.listCategories();

    expect(prisma.category.findMany).toHaveBeenCalledWith({
      orderBy: [{ name: 'asc' }, { slug: 'asc' }],
    });
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].slug).toBe('art-object');
  });
});
