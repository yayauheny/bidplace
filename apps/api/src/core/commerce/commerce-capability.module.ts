import { Module } from '@nestjs/common';

import { loadServerEnv } from '../config';
import { CommerceCapability } from './commerce-capability';
import { CommerceEnabledGuard } from './commerce-enabled.guard';

@Module({
  providers: [
    {
      provide: CommerceCapability,
      useFactory: () => new CommerceCapability(loadServerEnv().COMMERCE_ENABLED),
    },
    CommerceEnabledGuard,
  ],
  exports: [CommerceCapability, CommerceEnabledGuard],
})
export class CommerceCapabilityModule {}
