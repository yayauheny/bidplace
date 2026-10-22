import { createHash } from 'node:crypto';
import type { AuthPrincipal } from '@bidplace/contracts';
import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import connectPgSimple from 'connect-pg-simple';
import type { Request, RequestHandler } from 'express';
import session from 'express-session';
import { Pool } from 'pg';

import {
  SERVER_ENV,
  type ServerEnv,
  requiresProductionSecurity,
} from '../core/config';
import { parseUserRole, parseUserStatus } from '../core/contracts';
import { PrismaService } from '../core/database';
import { readCookie } from './auth.helpers';
import { SESSION_COOKIE_NAME, SESSION_TTL_MS } from './auth.constants';

declare module 'express-session' {
  interface SessionData {
    principal?: {
      userId: string;
      version: number;
      authenticatedAt: number;
      expiresAt: number;
    };
    flowId?: string;
  }
}

export type SessionRequest = Request & { auth?: AuthPrincipal };

@Injectable()
export class SessionService implements OnModuleDestroy {
  readonly middleware: RequestHandler;
  private readonly pool: Pool;
  private readonly store: session.Store & { close?: () => void };
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @Inject(SERVER_ENV) env: ServerEnv,
    private readonly prisma: PrismaService,
  ) {
    const database = new URL(env.DATABASE_URL);
    this.pool = new Pool({ connectionString: env.DATABASE_URL, max: 3 });
    this.pool.on('error', () =>
      this.logger.error('Session database unavailable'),
    );
    const PgStore = connectPgSimple(session);
    this.store = new PgStore({
      pool: this.pool,
      schemaName: database.searchParams.get('schema') ?? 'public',
      tableName: 'auth_sessions',
      createTableIfMissing: false,
      errorLog: () => this.logger.error('Session store unavailable'),
    });
    const handler = session({
      name: SESSION_COOKIE_NAME,
      secret: env.SESSION_SECRET,
      store: this.store,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: requiresProductionSecurity(env),
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_TTL_MS,
      },
    });
    this.middleware = (request, response, next) =>
      handler(request, response, (error?: unknown) => {
        next(
          error
            ? new ServiceUnavailableException('Session storage unavailable')
            : undefined,
        );
      });
  }

  async authenticate(
    request: SessionRequest,
    optional = false,
  ): Promise<boolean> {
    if (request.headers.authorization)
      throw new UnauthorizedException('Unsupported authentication transport');
    const principal = request.session?.principal;
    if (!principal) {
      let supplied = false;
      try {
        supplied =
          readCookie(request.headers.cookie, SESSION_COOKIE_NAME) !== null;
      } catch {
        throw new UnauthorizedException('Invalid session cookie');
      }
      if (optional && (request.session?.flowId || !supplied)) return true;
      throw new UnauthorizedException('Authentication required');
    }
    if (
      !Number.isSafeInteger(principal.expiresAt) ||
      !Number.isSafeInteger(principal.authenticatedAt) ||
      !Number.isSafeInteger(principal.version) ||
      principal.version < 0 ||
      principal.expiresAt - principal.authenticatedAt > SESSION_TTL_MS ||
      principal.authenticatedAt > Date.now() ||
      principal.expiresAt <= Date.now()
    )
      throw new UnauthorizedException('Session expired');
    const user = await this.prisma.user.findUnique({
      where: { id: principal.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        sessionVersion: true,
      },
    });
    if (
      !user ||
      user.sessionVersion !== principal.version ||
      parseUserStatus(user.status, user.id) !== 'active'
    )
      throw new UnauthorizedException('Session revoked');
    request.auth = {
      sub: user.id,
      email: user.email,
      role: parseUserRole(user.role, user.id),
      sessionVersion: user.sessionVersion,
    };
    return true;
  }

  private async cancelFlows(
    request: SessionRequest,
    completingFlowId?: string,
  ): Promise<void> {
    await this.prisma.authFlow.updateMany({
      where: {
        browserHash: createHash('sha256')
          .update(request.sessionID)
          .digest('hex'),
        stage: { notIn: ['complete', 'cancelled', 'failed'] },
        ...(completingFlowId ? { id: { not: completingFlowId } } : {}),
      },
      data: { stage: 'cancelled', verifier: null, nonce: null },
    });
  }

  async login(
    request: SessionRequest,
    userId: string,
    version: number,
    completingFlowId?: string,
  ): Promise<void> {
    await this.cancelFlows(request, completingFlowId);
    const pending =
      !request.session.principal && request.session.flowId
        ? { id: request.sessionID, session: request.session }
        : null;
    await new Promise<void>((resolve, reject) =>
      request.session.regenerate((error: unknown) =>
        error
          ? reject(new ServiceUnavailableException('Session rotation failed'))
          : resolve(),
      ),
    );
    const now = Date.now();
    request.session.principal = {
      userId,
      version,
      authenticatedAt: now,
      expiresAt: now + SESSION_TTL_MS,
    };
    try {
      await this.save(request);
    } catch (error) {
      delete request.session.principal;
      if (pending) {
        request.sessionID = pending.id;
        request.session = pending.session;
        await this.save(request);
      }
      throw error;
    }
  }

  save(request: SessionRequest): Promise<void> {
    return new Promise((resolve, reject) =>
      request.session.save((error: unknown) =>
        error
          ? reject(new ServiceUnavailableException('Session save failed'))
          : resolve(),
      ),
    );
  }

  async destroy(request: SessionRequest): Promise<void> {
    await this.cancelFlows(request);
    return new Promise((resolve, reject) =>
      request.session.destroy((error: unknown) =>
        error
          ? reject(new ServiceUnavailableException('Session removal failed'))
          : resolve(),
      ),
    );
  }

  async onModuleDestroy(): Promise<void> {
    this.store.close?.();
    await this.pool.end();
  }
}
