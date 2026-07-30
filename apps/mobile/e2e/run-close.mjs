import '../../api/node_modules/reflect-metadata/Reflect.js';
import { NestFactory } from '../../api/node_modules/@nestjs/core/nest-factory.js';
import { AppModule } from '../../../apps/api/dist/app.module.js';
import { ListingLifecycleService } from '../../../apps/api/dist/lifecycle/listing-lifecycle.service.js';
import { RealtimeGateway } from '../../../apps/api/dist/realtime/realtime.gateway.js';

const app = await NestFactory.createApplicationContext(AppModule);
const gateway = app.get(RealtimeGateway);
gateway.server = { to: () => ({ emit: () => undefined }) };
const lifecycle = app.get(ListingLifecycleService);
const closed = await lifecycle.close(
  process.argv[2],
  new Date(process.argv[3]),
);
if (!closed) throw new Error('Listing was not closed by lifecycle service');
await app.close();
