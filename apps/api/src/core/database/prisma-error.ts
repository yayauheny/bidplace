const PRISMA_UNIQUE_CONSTRAINT_ERROR_CODE = 'P2002';
const PRISMA_SERIALIZABLE_CONFLICT_ERROR_CODE = 'P2034';

function hasPrismaErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === code
  );
}

export function isPrismaUniqueConstraintError(error: unknown): boolean {
  return hasPrismaErrorCode(error, PRISMA_UNIQUE_CONSTRAINT_ERROR_CODE);
}

export function prismaUniqueTargets(error: unknown): string[] {
  if (!isPrismaUniqueConstraintError(error)) return [];
  const target = (error as { meta?: { target?: unknown } }).meta?.target;
  if (Array.isArray(target)) {
    return target.filter((item): item is string => typeof item === 'string');
  }
  if (typeof target === 'string') return [target];
  return [];
}

export function isPrismaSerializableConflictError(error: unknown): boolean {
  return hasPrismaErrorCode(error, PRISMA_SERIALIZABLE_CONFLICT_ERROR_CODE);
}
