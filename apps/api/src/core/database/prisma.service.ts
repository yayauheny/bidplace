import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@bidplace/database';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  static queryCount = 0;

  constructor() {
    const countQueries = process.env.BIDPLACE_QUERY_COUNT === '1';
    super(
      countQueries
        ? { log: [{ emit: 'event', level: 'query' }] }
        : undefined,
    );
    if (countQueries) {
      (this as unknown as PrismaClient<'query'>).$on('query', () => {
        PrismaService.queryCount += 1;
      });
    }
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
