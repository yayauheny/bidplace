import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

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

  async getReadyStatus(): Promise<ReadyHealthStatus> {
    const timestamp = new Date().toISOString();

    try {
      await this.prisma.$queryRaw`SELECT 1`;

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
