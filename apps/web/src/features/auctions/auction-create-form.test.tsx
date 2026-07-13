import { createElement } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuctionCreateForm } from './auction-create-form';

const createMutationMock = vi.fn();
const publishMutationMock = vi.fn();
const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock('./hooks', () => ({
  useCreateAuctionMutation: () => ({
    mutateAsync: createMutationMock,
    isPending: false,
  }),
  usePublishAuctionMutation: () => ({
    mutateAsync: publishMutationMock,
    isPending: false,
  }),
}));

describe('AuctionCreateForm', () => {
  beforeEach(() => {
    createMutationMock.mockReset();
    publishMutationMock.mockReset();
    replaceMock.mockReset();
  });

  it('omits empty buy now price when creating an auction', async () => {
    const user = userEvent.setup();
    createMutationMock.mockResolvedValue({
      auction: {
        id: 'auction-1',
        slug: 'demo-auction',
      },
    });

    render(createElement(AuctionCreateForm));

    await user.type(screen.getByLabelText('Lot ID'), '11111111-1111-1111-1111-111111111111');
    await user.type(screen.getByLabelText('Slug'), 'demo-auction');
    await user.type(screen.getByLabelText('Стартовая цена'), '100');
    await user.type(screen.getByLabelText('Резервная цена'), '150');
    await user.selectOptions(screen.getByLabelText('Валюта'), 'USD');
    await user.type(screen.getByLabelText('Старт'), '2026-01-01T10:00');
    await user.type(screen.getByLabelText('Финиш'), '2026-01-01T12:00');
    await user.click(screen.getByRole('button', { name: 'Создать аукцион' }));

    await waitFor(() => {
      expect(createMutationMock).toHaveBeenCalledWith({
        lotId: '11111111-1111-1111-1111-111111111111',
        slug: 'demo-auction',
        startPrice: 100,
        reservePrice: 150,
        currency: 'USD',
        startsAt: '2026-01-01T07:00:00.000Z',
        endsAt: '2026-01-01T09:00:00.000Z',
        buyNowPrice: undefined,
      });
      expect(screen.getByText('Черновик создан')).toBeInTheDocument();
    });
  });
});
