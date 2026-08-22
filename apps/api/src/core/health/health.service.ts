import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

export const READY_TIMEOUT_MS = 2000;

export type HealthStatus = {
  status: 'ok';
  timestamp: string;
};

export type ReadyHealthStatus = {
  status: 'ok' | 'error';
  database: 'ok' | 'unavailable';
  timestamp: string;
};

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getStatus(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async getReadyStatus(
    timeoutMs: number = READY_TIMEOUT_MS,
  ): Promise<ReadyHealthStatus> {
    const timestamp = new Date().toISOString();

    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('database readiness probe timed out'));
          }, timeoutMs);
        }),
      ]);

      return {
        status: 'ok',
        database: 'ok',
        timestamp,
      };
    } catch {
      return {
        status: 'error',
        database: 'unavailable',
        timestamp,
      };
    }
  }
}
