import { Prisma } from '@prisma/client';

import { PrismaService } from './prisma.service';

const SERIALIZABLE_RETRYABLE_ERROR_CODE = 'P2034';

type SerializableTransactionClient = {
  $transaction: PrismaService['$transaction'];
};

export async function runSerializableTransaction<T>(
  prisma: SerializableTransactionClient,
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await prisma.$transaction(callback, {
        isolationLevel: 'Serializable',
      });
    } catch (error) {
      lastError = error;

      const isRetryable =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: unknown }).code === SERIALIZABLE_RETRYABLE_ERROR_CODE;

      if (!isRetryable || attempt === attempts) {
        throw error;
      }
    }
  }

  throw lastError;
}
