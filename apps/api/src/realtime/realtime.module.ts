import { Module } from '@nestjs/common';

import { loadServerEnv } from '../core/config';
import { CommerceCapabilityModule } from '../core/commerce';
import { RateLimitModule } from '../core/rate-limit';

import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';

@Module({
  imports: [CommerceCapabilityModule, RateLimitModule],
  providers: [
    {
      provide: 'REALTIME_TRUST_PROXY',
      useFactory: () => loadServerEnv().TRUST_PROXY,
    },
    RealtimeGateway,
    RealtimeService,
  ],
  exports: [RealtimeService],
})
export class RealtimeModule {}
