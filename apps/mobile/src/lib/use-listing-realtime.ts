import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

import { getApiUrl } from './environment';

type ListingRealtimeState = 'connecting' | 'connected' | 'reconnecting' | 'offline';

export function useListingRealtime(listingId: string | undefined, onSignal: () => void) {
  const callback = useRef(onSignal);
  const [state, setState] = useState<ListingRealtimeState>('offline');

  callback.current = onSignal;

  useEffect(() => {
    if (!listingId) return undefined;

    const socket = io(getApiUrl(), {
      transports: ['websocket'],
      withCredentials: false,
    });
    setState('connecting');
    const subscribe = () => {
      socket.emit('listing.join', { listingId });
      setState('connected');
      callback.current();
    };
    const signal = () => callback.current();

    socket.on('connect', subscribe);
    socket.on('reconnect_attempt', () => setState('reconnecting'));
    socket.on('disconnect', () => setState('offline'));
    socket.on('listing.updated', signal);
    socket.on('bid.placed', signal);
    socket.on('listing.ended', signal);

    return () => {
      socket.off('connect', subscribe);
      socket.off('reconnect_attempt');
      socket.off('disconnect');
      socket.off('listing.updated', signal);
      socket.off('bid.placed', signal);
      socket.off('listing.ended', signal);
      socket.disconnect();
    };
  }, [listingId]);

  return state;
}
