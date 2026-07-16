import { describe, expect, it } from 'vitest';

import {
  auctionCreateRequestSchema,
  auctionEndedEventPayloadSchema,
  auctionStatusSchema,
  auctionUpdatedEventPayloadSchema,
  auctionListResponseSchema,
  adminAuctionsResponseSchema,
  adminUsersResponseSchema,
  auctionResponseSchema,
  authResponseSchema,
  bidCreateRequestSchema,
  bidPlacedEventPayloadSchema,
  bidHistoryResponseSchema,
  bidPlacementResponseSchema,
  categoryListResponseSchema,
  lotCreateRequestSchema,
  lotResponseSchema,
  loginRequestSchema,
  paginationQuerySchema,
  publicAuctionDetailResponseSchema,
  registerRequestSchema,
  sellerProfileCreateRequestSchema,
  sellerProfileResponseSchema,
  sellerAuctionListResponseSchema,
  sellerLotListResponseSchema,
} from '../src';

describe('shared contracts', () => {
  it('accepts valid register payloads', () => {
    const result = registerRequestSchema.safeParse({
      email: 'seller@example.com',
      password: 'super-secret',
      phone: '+15555550123',
      displayName: 'Demo Seller',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid login payloads', () => {
    const result = loginRequestSchema.safeParse({
      email: 'not-an-email',
      password: '',
    });

    expect(result.success).toBe(false);
  });

  it('accepts valid seller profile payloads', () => {
    const result = sellerProfileCreateRequestSchema.safeParse({
      slug: 'demo-store',
      sellerType: 'creator',
      storeName: 'Demo Store',
      country: 'BY',
      contactPreference: 'telegram',
      socialLink: 'https://example.com',
      shortDescription: 'Short bio',
    });

    expect(result.success).toBe(true);
  });

  it('accepts seller profile responses', () => {
    const result = sellerProfileResponseSchema.safeParse({
      sellerProfile: {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        userId: 'e1e0ecb2-5d35-4d8e-8c22-47e89b3a2b9e',
        slug: 'demo-store',
        sellerType: 'creator',
        storeName: 'Demo Store',
        country: 'BY',
        contactPreference: 'telegram',
        socialLink: 'https://example.com',
        shortDescription: 'Short bio',
        status: 'active',
        createdAt: '2026-07-13T12:00:00.000Z',
        updatedAt: '2026-07-13T12:00:00.000Z',
      },
    });

    expect(result.success).toBe(true);
  });

  it('accepts category list responses', () => {
    const result = categoryListResponseSchema.safeParse({
      categories: [
        {
          id: 'b8d7d079-f07e-4cd0-b1e2-1f3a8c1d8f5b',
          slug: 'art-object',
          name: 'Art Object',
          description: 'Curated art and collectible pieces for MVP demos.',
          createdAt: '2026-07-13T12:00:00.000Z',
          updatedAt: '2026-07-13T12:00:00.000Z',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('accepts seller lot list responses', () => {
    const result = sellerLotListResponseSchema.safeParse({
      lots: [
        {
          id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
          sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
          categoryId: 'b8d7d079-f07e-4cd0-b1e2-1f3a8c1d8f5b',
          title: 'Signed Ceramic Vase',
          description: 'Handmade ceramic vase.',
          condition: 'excellent',
          images: ['/api/images/9cb88056-f0dc-4309-84e4-090af8ace1e2'],
          status: 'draft',
          createdAt: '2026-07-13T12:00:00.000Z',
          updatedAt: '2026-07-13T12:00:00.000Z',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('accepts seller auction list responses', () => {
    const result = sellerAuctionListResponseSchema.safeParse({
      auctions: [
        {
          id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
          lotId: '7d8f8d40-0cf6-4af1-b353-cc0c4fa7b7d6',
          sellerProfileId: '9a1bc5ce-2c2b-4b08-9d12-4ccdb0d78c73',
          slug: 'demo-auction',
          startPrice: 100,
          reservePrice: 150,
          currentPrice: 125,
          currency: 'USD',
          bidStep: 5,
          startsAt: '2026-07-13T12:00:00.000Z',
          endsAt: '2026-07-14T12:00:00.000Z',
          status: 'active',
          bidCount: 1,
          winnerBidId: null,
          buyNowPrice: null,
          createdAt: '2026-07-13T12:00:00.000Z',
          updatedAt: '2026-07-13T12:10:00.000Z',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('accepts auth responses with a user payload', () => {
    const result = authResponseSchema.safeParse({
      user: {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        email: 'seller@example.com',
        phone: '+15555550123',
        displayName: 'Demo Seller',
        role: 'user',
        status: 'active',
        createdAt: '2026-07-13T12:00:00.000Z',
        updatedAt: '2026-07-13T12:00:00.000Z',
      },
    });

    expect(result.success).toBe(true);
  });

  it('accepts admin user list responses', () => {
    const result = adminUsersResponseSchema.safeParse({
      users: [
        {
          id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
          email: 'seller@example.com',
          phone: '+15555550123',
          displayName: 'Demo Seller',
          role: 'user',
          status: 'active',
          createdAt: '2026-07-13T12:00:00.000Z',
          updatedAt: '2026-07-13T12:00:00.000Z',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('accepts admin auction list responses', () => {
    const result = adminAuctionsResponseSchema.safeParse({
      auctions: [
        {
          id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
          lotId: '7d8f8d40-0cf6-4af1-b353-cc0c4fa7b7d6',
          sellerProfileId: '9a1bc5ce-2c2b-4b08-9d12-4ccdb0d78c73',
          slug: 'demo-auction',
          startPrice: 100,
          reservePrice: 150,
          currentPrice: 100,
          currency: 'USD',
          bidStep: 5,
          startsAt: '2026-07-13T12:00:00.000Z',
          endsAt: '2026-07-14T12:00:00.000Z',
          status: 'active',
          bidCount: 0,
          winnerBidId: null,
          buyNowPrice: null,
          createdAt: '2026-07-13T12:00:00.000Z',
          updatedAt: '2026-07-13T12:00:00.000Z',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects unknown auction statuses', () => {
    expect(auctionStatusSchema.safeParse('pending').success).toBe(false);
  });

  it('accepts valid auction create payloads', () => {
    const result = auctionCreateRequestSchema.safeParse({
      lotId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      slug: 'demo-auction',
      startPrice: 100,
      reservePrice: 150,
      currency: 'USD',
      startsAt: '2026-07-13T12:00:00.000Z',
      endsAt: '2026-07-14T12:00:00.000Z',
    });

    expect(result.success).toBe(true);
  });

  it('accepts auction responses', () => {
    const result = auctionResponseSchema.safeParse({
      auction: {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        lotId: '7d8f8d40-0cf6-4af1-b353-cc0c4fa7b7d6',
        sellerProfileId: '9a1bc5ce-2c2b-4b08-9d12-4ccdb0d78c73',
        slug: 'demo-auction',
        startPrice: 100,
        reservePrice: 150,
        currentPrice: 100,
        currency: 'USD',
        bidStep: 5,
        startsAt: '2026-07-13T12:00:00.000Z',
        endsAt: '2026-07-14T12:00:00.000Z',
        status: 'draft',
        bidCount: 0,
        winnerBidId: null,
        buyNowPrice: null,
        createdAt: '2026-07-13T12:00:00.000Z',
        updatedAt: '2026-07-13T12:00:00.000Z',
      },
    });

    expect(result.success).toBe(true);
  });

  it('accepts public auction list responses', () => {
    const result = auctionListResponseSchema.safeParse({
      auctions: [
        {
          auction: {
            id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
            lotId: '7d8f8d40-0cf6-4af1-b353-cc0c4fa7b7d6',
            sellerProfileId: '9a1bc5ce-2c2b-4b08-9d12-4ccdb0d78c73',
            slug: 'demo-auction',
            startPrice: 100,
            reservePrice: 150,
            currentPrice: 100,
            currency: 'USD',
            bidStep: 5,
            startsAt: '2026-07-13T12:00:00.000Z',
            endsAt: '2026-07-14T12:00:00.000Z',
            status: 'active',
            bidCount: 0,
            winnerBidId: null,
            buyNowPrice: null,
            createdAt: '2026-07-13T12:00:00.000Z',
            updatedAt: '2026-07-13T12:00:00.000Z',
          },
          lot: {
            id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
            sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
            categoryId: 'b8d7d079-f07e-4cd0-b1e2-1f3a8c1d8f5b',
            title: 'Signed Ceramic Vase',
            description: 'Handmade ceramic vase.',
            condition: 'excellent',
            images: ['/api/images/9cb88056-f0dc-4309-84e4-090af8ace1e2'],
            status: 'published',
            createdAt: '2026-07-13T12:00:00.000Z',
            updatedAt: '2026-07-13T12:00:00.000Z',
          },
          sellerProfile: {
            id: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
            userId: 'e1e0ecb2-5d35-4d8e-8c22-47e89b3a2b9e',
            slug: 'demo-store',
            sellerType: 'creator',
            storeName: 'Demo Store',
            country: 'BY',
            contactPreference: 'telegram',
            socialLink: 'https://example.com',
            shortDescription: 'Short bio',
            status: 'active',
            createdAt: '2026-07-13T12:00:00.000Z',
            updatedAt: '2026-07-13T12:00:00.000Z',
          },
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('accepts public auction detail responses', () => {
    const result = publicAuctionDetailResponseSchema.safeParse({
      auction: {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        lotId: '7d8f8d40-0cf6-4af1-b353-cc0c4fa7b7d6',
        sellerProfileId: '9a1bc5ce-2c2b-4b08-9d12-4ccdb0d78c73',
        slug: 'demo-auction',
        startPrice: 100,
        reservePrice: 150,
        currentPrice: 125,
        currency: 'USD',
        bidStep: 5,
        startsAt: '2026-07-13T12:00:00.000Z',
        endsAt: '2026-07-14T12:00:00.000Z',
        status: 'active',
        bidCount: 1,
        winnerBidId: null,
        buyNowPrice: null,
        createdAt: '2026-07-13T12:00:00.000Z',
        updatedAt: '2026-07-13T12:10:00.000Z',
      },
      lot: {
        id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
        sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
        categoryId: 'b8d7d079-f07e-4cd0-b1e2-1f3a8c1d8f5b',
        title: 'Signed Ceramic Vase',
        description: 'Handmade ceramic vase.',
        condition: 'excellent',
        images: ['/api/images/9cb88056-f0dc-4309-84e4-090af8ace1e2'],
        status: 'published',
        createdAt: '2026-07-13T12:00:00.000Z',
        updatedAt: '2026-07-13T12:00:00.000Z',
      },
      sellerProfile: {
        id: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
        userId: 'e1e0ecb2-5d35-4d8e-8c22-47e89b3a2b9e',
        slug: 'demo-store',
        sellerType: 'creator',
        storeName: 'Demo Store',
        country: 'BY',
        contactPreference: 'telegram',
        socialLink: 'https://example.com',
        shortDescription: 'Short bio',
        status: 'active',
        createdAt: '2026-07-13T12:00:00.000Z',
        updatedAt: '2026-07-13T12:00:00.000Z',
      },
      bids: [
        {
          id: 'd61f66d2-8866-4b4c-b77d-6a09d1f82f9a',
          auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
          amount: 125,
          status: 'winning',
          createdAt: '2026-07-13T12:10:00.000Z',
          updatedAt: '2026-07-13T12:10:00.000Z',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects money amounts with more than two decimal places', () => {
    expect(bidCreateRequestSchema.safeParse({ amount: 10.001 }).success).toBe(false);
    expect(
      auctionCreateRequestSchema.safeParse({
        lotId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        slug: 'demo-auction',
        startPrice: 100.001,
        reservePrice: 150,
        currency: 'USD',
        startsAt: '2026-07-13T12:00:00.000Z',
        endsAt: '2026-07-14T12:00:00.000Z',
      }).success,
    ).toBe(false);
  });

  it('accepts pagination queries with defaults', () => {
    const result = paginationQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('accepts valid lot create payloads', () => {
    const result = lotCreateRequestSchema.safeParse({
      categoryId: 'b8d7d079-f07e-4cd0-b1e2-1f3a8c1d8f5b',
      title: 'Signed Ceramic Vase',
      description: 'Handmade ceramic vase.',
      condition: 'excellent',
    });

    expect(result.success).toBe(true);
  });

  it('accepts lot responses', () => {
    const result = lotResponseSchema.safeParse({
      lot: {
        id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
        sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
        categoryId: 'b8d7d079-f07e-4cd0-b1e2-1f3a8c1d8f5b',
        title: 'Signed Ceramic Vase',
        description: 'Handmade ceramic vase.',
        condition: 'excellent',
        images: ['/api/images/9cb88056-f0dc-4309-84e4-090af8ace1e2'],
        status: 'draft',
        createdAt: '2026-07-13T12:00:00.000Z',
        updatedAt: '2026-07-13T12:00:00.000Z',
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid bid amounts', () => {
    expect(bidCreateRequestSchema.safeParse({ amount: 0 }).success).toBe(false);
  });

  it('accepts bid placement responses', () => {
    const result = bidPlacementResponseSchema.safeParse({
      bid: {
        id: 'd61f66d2-8866-4b4c-b77d-6a09d1f82f9a',
        auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        bidderUserId: 'e1e0ecb2-5d35-4d8e-8c22-47e89b3a2b9e',
        amount: 125,
        status: 'winning',
        createdAt: '2026-07-13T12:10:00.000Z',
        updatedAt: '2026-07-13T12:10:00.000Z',
      },
      auction: {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        lotId: '7d8f8d40-0cf6-4af1-b353-cc0c4fa7b7d6',
        sellerProfileId: '9a1bc5ce-2c2b-4b08-9d12-4ccdb0d78c73',
        slug: 'demo-auction',
        startPrice: 100,
        reservePrice: 150,
        currentPrice: 125,
        currency: 'USD',
        bidStep: 5,
        startsAt: '2026-07-13T12:00:00.000Z',
        endsAt: '2026-07-14T12:00:00.000Z',
        status: 'active',
        bidCount: 1,
        winnerBidId: null,
        buyNowPrice: null,
        createdAt: '2026-07-13T12:00:00.000Z',
        updatedAt: '2026-07-13T12:10:00.000Z',
      },
    });

    expect(result.success).toBe(true);
  });

  it('accepts bid history responses', () => {
    const result = bidHistoryResponseSchema.safeParse({
      bids: [
        {
          id: 'd61f66d2-8866-4b4c-b77d-6a09d1f82f9a',
          auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
          bidderUserId: 'e1e0ecb2-5d35-4d8e-8c22-47e89b3a2b9e',
          amount: 125,
          status: 'winning',
          createdAt: '2026-07-13T12:10:00.000Z',
          updatedAt: '2026-07-13T12:10:00.000Z',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('accepts websocket auction update payloads', () => {
    const result = auctionUpdatedEventPayloadSchema.safeParse({
      auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      currentPrice: 120,
      bidCount: 3,
      status: 'active',
      endsAt: '2026-07-14T12:00:00.000Z',
      winnerBidId: null,
      reserveReached: false,
    });

    expect(result.success).toBe(true);
  });

  it('accepts websocket bid placed payloads', () => {
    const result = bidPlacedEventPayloadSchema.safeParse({
      auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      currentPrice: 125,
      bidCount: 4,
      bid: {
        id: 'd61f66d2-8866-4b4c-b77d-6a09d1f82f9a',
        auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        amount: 125,
        status: 'active',
        createdAt: '2026-07-13T12:10:00.000Z',
        updatedAt: '2026-07-13T12:10:00.000Z',
      },
    });

    expect(result.success).toBe(true);
  });

  it('accepts websocket auction ended payloads', () => {
    const result = auctionEndedEventPayloadSchema.safeParse({
      auctionId: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      status: 'sold',
      winnerBidId: 'd61f66d2-8866-4b4c-b77d-6a09d1f82f9a',
      reserveReached: true,
    });

    expect(result.success).toBe(true);
  });
});
