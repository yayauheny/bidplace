'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useApiClient } from '../../providers/api-provider';
import { createRealtimeSocket } from '../../lib/realtime';
import { auctionKeys } from './hooks';

export function useAuctionRealtime(auctionId?: string | null) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!auctionId) {
      return;
    }

    const socket = createRealtimeSocket(api.baseUrl);

    const handleUpdate = (payload: { auctionId: string }) => {
      if (payload.auctionId !== auctionId) {
        return;
      }

      void queryClient.invalidateQueries({ queryKey: auctionKeys.all });
      void queryClient.invalidateQueries({
        queryKey: auctionKeys.detail(auctionId),
      });
    };

    socket.on('auction.updated', handleUpdate);
    socket.on('bid.placed', handleUpdate);
    socket.on('auction.ended', handleUpdate);
    socket.connect();

    return () => {
      socket.off('auction.updated', handleUpdate);
      socket.off('bid.placed', handleUpdate);
      socket.off('auction.ended', handleUpdate);
      socket.disconnect();
    };
  }, [api.baseUrl, auctionId, queryClient]);
}
