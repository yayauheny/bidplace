import { io, type Socket } from 'socket.io-client';

export function createRealtimeSocket(baseUrl: string): Socket {
  return io(new URL('/realtime', baseUrl).toString(), {
    autoConnect: false,
    transports: ['websocket'],
  });
}
