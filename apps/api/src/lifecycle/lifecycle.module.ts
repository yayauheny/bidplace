import { Module } from '@nestjs/common'; import { DatabaseModule } from '../core/database'; import { ClockModule } from '../core/time'; import { ListingLifecycleService } from './listing-lifecycle.service';
@Module({ imports: [DatabaseModule, ClockModule], providers: [ListingLifecycleService], exports: [ListingLifecycleService] }) export class LifecycleModule {}
