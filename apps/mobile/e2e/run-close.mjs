import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../apps/api/dist/app.module.js';
import { ListingLifecycleService } from '../../../apps/api/dist/lifecycle/listing-lifecycle.service.js';

const app = await NestFactory.createApplicationContext(AppModule);
const lifecycle = app.get(ListingLifecycleService);
const closed = await lifecycle.close(process.argv[2], new Date(process.argv[3]));
if (!closed) throw new Error('Listing was not closed by lifecycle service');
await app.close();
