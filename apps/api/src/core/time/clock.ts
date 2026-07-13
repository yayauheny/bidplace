import { Global, Injectable, Module } from '@nestjs/common';

export abstract class Clock {
  abstract now(): Date;
}

@Injectable()
export class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: Clock,
      useClass: SystemClock,
    },
  ],
  exports: [Clock],
})
export class ClockModule {}
