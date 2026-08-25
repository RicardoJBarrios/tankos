import { createEntityId } from '@tankos/data-access';
import {
  boundedMap,
  createItemFailure,
  summarizeResults,
  terminalStatus,
} from './firestore-admin-batch-execution-support';

describe('firestore admin batch execution support', () => {
  it('Given ordered items, When boundedMap executes them, Then it returns results in input order', async () => {
    await expect(
      boundedMap([1, 2, 3], 2, async (value) => value * 2),
    ).resolves.toEqual([2, 4, 6]);
  });

  it('Given an Error, When normalizing it, Then preserves its diagnostic fields', () => {
    expect(
      createItemFailure(createEntityId('item'), new Error('failure')),
    ).toMatchObject({ outcome: 'failed', message: 'failure' });
  });

  it('Given a non-Error failure, When normalizing it, Then uses a stable fallback', () => {
    expect(createItemFailure(createEntityId('item'), 'failure')).toMatchObject({
      outcome: 'failed',
      code: 'unknown',
      message: 'Unknown failure',
    });
  });

  it('Given mixed outcomes, When summarizing them, Then counts each outcome', () => {
    expect(
      summarizeResults([
        { id: createEntityId('a'), outcome: 'succeeded' },
        { id: createEntityId('b'), outcome: 'warning', message: 'warn' },
        {
          id: createEntityId('c'),
          outcome: 'failed',
          code: 'error',
          message: 'fail',
        },
      ]),
    ).toEqual({ succeeded: 1, warnings: 1, failures: 1 });
  });

  it.each([
    [1, 0, 'failed'],
    [0, 1, 'completed-with-warnings'],
    [0, 0, 'completed'],
  ] as const)(
    'Given %s failures and %s warnings, Then returns %s',
    (failures, warnings, expected) => {
      expect(terminalStatus(failures, warnings)).toBe(expected);
    },
  );
});
