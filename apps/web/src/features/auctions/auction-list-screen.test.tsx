import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AuctionListScreen } from './auction-list-screen';

const usePublicAuctionsQueryMock = vi.fn();

vi.mock('./hooks', () => ({
  usePublicAuctionsQuery: () => usePublicAuctionsQueryMock(),
}));

describe('AuctionListScreen', () => {
  it('renders public auctions from the query', () => {
    usePublicAuctionsQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      data: {
        auctions: [
          {
            auction: {
              id: 'auction-1',
              slug: 'demo-auction',
              status: 'active',
              currentPrice: 120,
              currency: 'USD',
              bidCount: 3,
              bidStep: 10,
              reservePrice: 150,
              startsAt: '2026-01-01T10:00:00.000Z',
              endsAt: '2026-01-02T10:00:00.000Z',
            },
            lot: {
              title: 'Vintage camera',
              description: 'Classic camera in good condition',
              condition: 'good',
              images: [],
            },
            sellerProfile: {
              slug: 'demo-store',
              storeName: 'Demo Store',
              country: 'BY',
              sellerType: 'creator',
              contactPreference: 'telegram',
            },
          },
        ],
      },
    });

    render(createElement(AuctionListScreen));

    expect(screen.getByText('Публичный каталог')).toBeInTheDocument();
    expect(screen.getByText('Vintage camera')).toBeInTheDocument();
    expect(screen.getByText('Demo Store')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Vintage camera/i })).toHaveAttribute(
      'href',
      '/auctions/demo-auction',
    );
  });
});
