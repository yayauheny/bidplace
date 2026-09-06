import { Prisma } from '@bidplace/database';

import { PrismaService } from './prisma.service';
import { isPrismaSerializableConflictError } from './prisma-error';

type SerializableTransactionClient = {
  $transaction: PrismaService['$transaction'];
};

export async function runSerializableTransaction<T>(
  prisma: SerializableTransactionClient,
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  attempts = 3,
): Promise<T> {
  return runTransaction(
    prisma,
    callback,
    { isolationLevel: 'Serializable' },
    attempts,
  );
}

export async function runReadCommittedTransaction<T>(
  prisma: SerializableTransactionClient,
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  attempts = 3,
): Promise<T> {
  return runTransaction(
    prisma,
    callback,
    { isolationLevel: 'ReadCommitted' },
    attempts,
  );
}

async function runTransaction<T>(
  prisma: SerializableTransactionClient,
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  options: { isolationLevel: 'Serializable' | 'ReadCommitted' },
  attempts: number,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await prisma.$transaction(callback, options);
    } catch (error) {
      lastError = error;

      if (!isPrismaSerializableConflictError(error) || attempt === attempts) {
        throw error;
      }
    }
  }

  throw lastError;
}
