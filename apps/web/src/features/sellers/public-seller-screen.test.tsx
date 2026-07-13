import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PublicSellerScreen } from './public-seller-screen';

const useSellerPublicProfileQueryMock = vi.fn();
const usePublicAuctionsQueryMock = vi.fn();

vi.mock('../auctions/hooks', () => ({
  useSellerPublicProfileQuery: () => useSellerPublicProfileQueryMock(),
  usePublicAuctionsQuery: () => usePublicAuctionsQueryMock(),
}));

vi.mock('../../providers/api-provider', () => ({
  usePublicApiUrl: () => 'http://localhost:3001',
}));

describe('PublicSellerScreen', () => {
  it('keeps the auctions section in loading state while auctions are loading', () => {
    useSellerPublicProfileQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      data: {
        sellerProfile: {
          slug: 'demo-store',
          storeName: 'Demo Store',
          country: 'BY',
          sellerType: 'creator',
          contactPreference: 'telegram',
          shortDescription: 'About the store',
          socialLink: 'https://example.com',
        },
      },
    });
    usePublicAuctionsQueryMock.mockReturnValue({
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
      data: undefined,
    });

    render(createElement(PublicSellerScreen, { slug: 'demo-store' }));

    expect(screen.getByText('Demo Store')).toBeInTheDocument();
    expect(screen.getByText('Подбираем аукционы')).toBeInTheDocument();
    expect(screen.queryByText('Нет публичных аукционов')).not.toBeInTheDocument();
  });
});
