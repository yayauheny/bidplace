import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { SERVER_ENV, type ServerEnv } from '../config';
import { buildReleaseId } from './build-release';

export const READY_TIMEOUT_MS = 2000;

export type HealthStatus = {
  status: 'ok';
  timestamp: string;
  releaseId?: string | null;
};

export type ReadyHealthStatus = {
  status: 'ok' | 'error';
  database: 'ok' | 'unavailable';
  timestamp: string;
  releaseId?: string | null;
};

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(SERVER_ENV) private readonly env: ServerEnv,
  ) {}

  getStatus(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      ...(this.env.APP_ENV === 'staging' ? { releaseId: buildReleaseId } : {}),
    };
  }

  async getReadyStatus(
    timeoutMs: number = READY_TIMEOUT_MS,
  ): Promise<ReadyHealthStatus> {
    const timestamp = new Date().toISOString();
    let timer: ReturnType<typeof setTimeout> | undefined;

    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            reject(new Error('database readiness probe timed out'));
          }, timeoutMs);
        }),
      ]);

      return {
        status: 'ok',
        database: 'ok',
        timestamp,
        ...(this.env.APP_ENV === 'staging'
          ? { releaseId: buildReleaseId }
          : {}),
      };
    } catch {
      return {
        status: 'error',
        database: 'unavailable',
        timestamp,
      };
    } finally {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    }
  }
}
