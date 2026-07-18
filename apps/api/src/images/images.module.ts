import { Module } from '@nestjs/common'; import { AuthModule } from '../auth'; import { DatabaseModule } from '../core/database'; import { ImagesController } from './images.controller'; import { ImagesService } from './images.service';
@Module({ imports: [AuthModule, DatabaseModule], controllers: [ImagesController], providers: [ImagesService] }) export class ImagesModule {}
