import type { BatchSubmissionServiceOptions } from './batch-submission-service';

/** Internal normalized configuration for durable batch submission. */
export interface BatchSubmissionConfiguration {
  readonly chunkSize: number;
  readonly maxTargets: number;
  readonly maxRequestBytes: number;
  readonly materializerOwnerId: string;
  readonly materializationLeaseDurationMilliseconds: number;
}

/** Normalizes and validates submission limits. */
export function resolveSubmissionConfiguration<TPayload, TFilter>(
  options: BatchSubmissionServiceOptions<TPayload, TFilter>,
): BatchSubmissionConfiguration {
  const configuration = {
    chunkSize: options.chunkSize ?? 400,
    maxTargets: options.maxTargets ?? 10_000,
    maxRequestBytes: options.maxRequestBytes ?? 900_000,
    materializerOwnerId: options.materializerOwnerId ?? 'default-materializer',
    materializationLeaseDurationMilliseconds:
      options.materializationLeaseDurationMilliseconds ?? 60_000,
  };
  assertIntegerRange(
    configuration.chunkSize,
    1,
    400,
    'Batch chunk size must be an integer between 1 and 400',
  );
  assertIntegerRange(
    configuration.maxTargets,
    1,
    Number.MAX_SAFE_INTEGER,
    'Batch target limit must be a positive integer',
  );
  assertIntegerRange(
    configuration.maxRequestBytes,
    1_000,
    900_000,
    'Batch request size must be an integer between 1000 and 900000 bytes',
  );
  if (!configuration.materializerOwnerId.trim())
    throw new RangeError('Materialization lease configuration is invalid');
  assertIntegerRange(
    configuration.materializationLeaseDurationMilliseconds,
    1,
    Number.MAX_SAFE_INTEGER,
    'Materialization lease configuration is invalid',
  );
  return configuration;
}

function assertIntegerRange(
  value: number,
  minimum: number,
  maximum: number,
  message: string,
): void {
  if (!isValidIntegerRange(value, minimum, maximum))
    throw new RangeError(message);
}

function isValidIntegerRange(
  value: number,
  minimum: number,
  maximum: number,
): boolean {
  return Number.isInteger(value) && value >= minimum && value <= maximum;
}
