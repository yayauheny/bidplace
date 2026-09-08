import { describe, expect, it, vi } from 'vitest';

import { PortfolioService } from './portfolio.service';

describe('PortfolioService', () => {
  it('requires a city when selecting public portfolio authors', async () => {
    const sellers = {
      listPublic: vi.fn().mockResolvedValue({
        sellers: [],
        pagination: { page: 1, limit: 20, total: 0 },
      }),
    };
    const service = new PortfolioService({} as never, sellers as never);

    await service.listAuthors({ page: 1, limit: 20, sort: 'added' });

    expect(sellers.listPublic).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20, sort: 'activity' }),
      { requireCity: true },
    );
  });

  it('requires a city when loading a public portfolio author', async () => {
    const sellers = {
      getPublic: vi.fn().mockResolvedValue(null),
    };
    const service = new PortfolioService({} as never, sellers as never);

    await expect(
      service.getAuthor('author-slug', { page: 1, limit: 20, sort: 'newest' }),
    ).rejects.toThrow('Author not found');

    expect(sellers.getPublic).toHaveBeenCalledWith(
      'author-slug',
      { page: 1, limit: 20, sort: 'newest' },
      { requireCity: true },
    );
  });
});
