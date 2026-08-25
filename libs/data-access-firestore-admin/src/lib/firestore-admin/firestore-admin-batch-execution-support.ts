import type {
  BatchItemResult,
  BatchOperationRecord,
  EntityId,
} from '@tankos/data-access';

/** Executes a bounded number of asynchronous item operations concurrently. */
export async function boundedMap<TItem, TResult>(
  items: readonly TItem[],
  concurrency: number,
  callback: (item: TItem) => Promise<TResult>,
): Promise<TResult[]> {
  const results = new Array<TResult>(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, items.length) },
      async (): Promise<void> => {
        while (cursor < items.length) {
          const index = cursor++;
          results[index] = await callback(items[index]);
        }
      },
    ),
  );
  return results;
}

/** Normalizes an item exception into the durable result contract. */
export function createItemFailure(
  id: EntityId,
  error: unknown,
): BatchItemResult {
  return {
    id,
    outcome: 'failed',
    code: error instanceof Error ? error.name : 'unknown',
    message: error instanceof Error ? error.message : 'Unknown failure',
  };
}

/** Aggregates item outcomes for one chunk attempt. */
export function summarizeResults(results: readonly BatchItemResult[]): {
  readonly succeeded: number;
  readonly warnings: number;
  readonly failures: number;
} {
  return {
    succeeded: results.filter((result) => result.outcome === 'succeeded')
      .length,
    warnings: results.filter((result) => result.outcome === 'warning').length,
    failures: results.filter((result) => result.outcome === 'failed').length,
  };
}

/** Resolves the terminal status from the accumulated item outcomes. */
export function terminalStatus(
  failures: number,
  warnings: number,
): BatchOperationRecord<unknown>['status'] {
  if (failures > 0) return 'failed';
  if (warnings > 0) return 'completed-with-warnings';
  return 'completed';
}
