import { Module } from '@nestjs/common'; import { AuthModule } from '../auth'; import { DatabaseModule } from '../core/database'; import { AdminController } from './admin.controller'; import { AdminGuard } from './admin.guard';
@Module({ imports: [AuthModule, DatabaseModule], controllers: [AdminController], providers: [AdminGuard] }) export class AdminModule {}
