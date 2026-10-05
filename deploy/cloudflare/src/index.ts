import { Container } from '@cloudflare/containers';

import { containerEnvironment, type RuntimeEnvironment } from './environment';
import { routeRequest, type RouterBindings } from './router';

type Environment = RuntimeEnvironment & RouterBindings;

export class PortfolioApi extends Container<Environment> {
  defaultPort = 3001;
  pingEndpoint = 'localhost/api/health';
  sleepAfter = '10m';
  enableInternet = true;
  envVars = containerEnvironment(this.env);

  override onStart(): void {
    console.log('Portfolio API container started');
  }

  override onError(): void {
    console.error('Portfolio API container failed; inspect Container logs');
  }
}

export default {
  fetch(request: Request, env: Environment, ctx: ExecutionContext): Promise<Response> {
    return routeRequest(request, env, ctx, caches.default);
  },
} satisfies ExportedHandler<Environment>;
