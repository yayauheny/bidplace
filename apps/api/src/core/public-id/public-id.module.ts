import { Global, Module } from '@nestjs/common'; import { PublicIdService } from './public-id.service';
@Global() @Module({ providers: [PublicIdService], exports: [PublicIdService] }) export class PublicIdModule {}
