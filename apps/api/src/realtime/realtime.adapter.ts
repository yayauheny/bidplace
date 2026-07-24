import { IoAdapter } from '@nestjs/platform-socket.io';
import { type INestApplicationContext } from '@nestjs/common';
import { type Server, type ServerOptions } from 'socket.io';

import type { ServerEnv } from '../core/config';
import { createRealtimeSocketOptions } from './realtime.options';

export class RealtimeSocketIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly env: Pick<ServerEnv, 'CORS_ORIGIN'>,
  ) {
    super(app);
  }

  override createIOServer(
    port: number,
    options?: ServerOptions,
  ): Server {
    return super.createIOServer(port, {
      ...options,
      ...createRealtimeSocketOptions(this.env),
    });
  }
}
