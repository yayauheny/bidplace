import { ApiErrorCode } from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';

import { AppException } from '../errors';
import { PrismaService } from './prisma.service';
import { isPrismaSerializableConflictError } from './prisma-error';

export class RetryableTransactionConflict extends Error {
  constructor() {
    super('Transaction conflict');
    this.name = 'RetryableTransactionConflict';
  }
}

function causeOf(error: unknown): unknown {
  if (typeof error === 'object' && error !== null && 'cause' in error) {
    return (error as { cause: unknown }).cause;
  }
  return undefined;
}

function hasRetryableTransactionConflict(error: unknown, depth = 0): boolean {
  if (error instanceof RetryableTransactionConflict) return true;
  if (depth >= 3) return false;
  const cause = causeOf(error);
  return cause === undefined
    ? false
    : hasRetryableTransactionConflict(cause, depth + 1);
}

function isRetryableTransactionConflict(error: unknown, depth = 0): boolean {
  if (hasRetryableTransactionConflict(error, depth)) return true;
  if (isPrismaSerializableConflictError(error)) return true;
  if (depth >= 3) return false;
  const cause = causeOf(error);
  return cause === undefined
    ? false
    : isRetryableTransactionConflict(cause, depth + 1);
}

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

      if (!isRetryableTransactionConflict(error) || attempt === attempts) {
        if (hasRetryableTransactionConflict(error)) {
          throw new AppException({
            status: 409,
            code: ApiErrorCode.CONFLICT,
            message: 'Conflict',
          });
        }
        throw error;
      }
    }
  }

  throw lastError;
}
