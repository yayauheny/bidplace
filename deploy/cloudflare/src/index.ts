import { Container, type State } from '@cloudflare/containers';

import { containerEnvironment, type RuntimeEnvironment } from './environment';
import { containerStopped } from './release-gate';
import { routeRequest, runScheduledTick, type RouterBindings } from './router';

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

  override async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path !== '/__release/stop' && path !== '/__release/state') return super.fetch(request);
    if (path === '/__release/stop') await this.stop('SIGTERM');
    const state = await this.confirmState(path === '/__release/stop');
    return Response.json(state, {
      status: containerStopped(state) ? 200 : 409,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  private async confirmState(wait: boolean): Promise<State> {
    let state = await this.getState();
    const deadline = Date.now() + (wait ? 2_000 : 0);
    while (!containerStopped(state) && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      state = await this.getState();
    }
    return state;
  }
}

export default {
  scheduled(_controller: ScheduledController, env: Environment, ctx: ExecutionContext): void {
    ctx.waitUntil(runScheduledTick(env));
  },
  fetch(request: Request, env: Environment, ctx: ExecutionContext): Promise<Response> {
    return routeRequest(request, env, ctx, caches.default);
  },
} satisfies ExportedHandler<Environment>;
