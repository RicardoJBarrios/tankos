import { describe, expect, it } from 'vitest';
import { resolveSubmissionConfiguration } from './batch-submission-service-configuration';

describe('resolveSubmissionConfiguration', () => {
  it('Given omitted limits, When resolving configuration, Then it applies safe defaults', () => {
    expect(resolveSubmissionConfiguration({} as never)).toMatchObject({
      chunkSize: 400,
      maxTargets: 10_000,
      maxRequestBytes: 900_000,
      materializerOwnerId: 'default-materializer',
      materializationLeaseDurationMilliseconds: 60_000,
    });
  });

  it.each([
    { chunkSize: 0 },
    { chunkSize: 401 },
    { maxTargets: 0 },
    { maxRequestBytes: 999 },
    { materializerOwnerId: ' ' },
    { materializationLeaseDurationMilliseconds: 0 },
  ])(
    'Given invalid configuration %s, When resolving it, Then it rejects the value',
    (override) => {
      expect(() =>
        resolveSubmissionConfiguration({ ...override } as never),
      ).toThrow(RangeError);
    },
  );
});
