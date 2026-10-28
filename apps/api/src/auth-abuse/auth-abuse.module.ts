import { Global, Module } from '@nestjs/common';

import { SERVER_ENV, type ServerEnv } from '../core/config';
import { AuthAbuseService } from './auth-abuse.service';
import { AuthAbuseStore } from './auth-abuse.store';
import { DisposableEmailList } from './disposable-email';
import { TurnstileVerifier, createTurnstileVerifier } from './turnstile-verifier';

@Global()
@Module({
  providers: [
    AuthAbuseStore,
    DisposableEmailList,
    {
      provide: TurnstileVerifier,
      inject: [SERVER_ENV],
      useFactory: (env: ServerEnv) => createTurnstileVerifier(env),
    },
    AuthAbuseService,
  ],
  exports: [AuthAbuseService, DisposableEmailList],
})
export class AuthAbuseModule {}
