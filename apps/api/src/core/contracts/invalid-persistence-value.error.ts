export type InvalidPersistenceValueErrorOptions = {
  entity: string;
  field: string;
  value: string;
  recordId?: string;
};

export class InvalidPersistenceValueError extends Error {
  readonly entity: string;

  readonly field: string;

  readonly value: string;

  readonly recordId: string | undefined;

  constructor(options: InvalidPersistenceValueErrorOptions) {
    const recordIdSuffix = options.recordId ? ` for record ${options.recordId}` : '';
    super(
      `Invalid persistence value${recordIdSuffix}: ${options.entity}.${options.field}=${options.value}`,
    );
    this.name = 'InvalidPersistenceValueError';
    this.entity = options.entity;
    this.field = options.field;
    this.value = options.value;
    this.recordId = options.recordId;
  }
}
