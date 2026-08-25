import { describe, expect, it } from 'vitest';
import { createDataAccessError } from './firestore-errors';

describe('createDataAccessError', () => {
  it('Given a transient provider failure, When mapped, Then preserves retryability and the original message', () => {
    const result = createDataAccessError(
      'transient',
      'Firestore failed',
      new Error('network down'),
    );

    expect(result).toMatchObject({
      name: 'DataAccessError',
      code: 'transient',
      retryable: true,
      message: 'Firestore failed: network down',
    });
  });

  it('Given a non-error provider value, When mapped, Then stringifies the cause without marking it retryable', () => {
    const result = createDataAccessError(
      'validation',
      'Invalid document',
      'bad payload',
    );

    expect(result).toMatchObject({
      code: 'validation',
      retryable: false,
      message: 'Invalid document: bad payload',
    });
  });

  it('Given no provider cause, When mapped, Then keeps the stable message unchanged', () => {
    expect(createDataAccessError('not-found', 'Missing document').message).toBe(
      'Missing document',
    );
  });

  it('Given a structured provider value, When mapped, Then retains its JSON cause', () => {
    expect(
      createDataAccessError('validation', 'Invalid document', {
        reason: 'bad',
      }),
    ).toMatchObject({ message: 'Invalid document: {"reason":"bad"}' });
  });

  it('Given an unserializable provider value, When mapped, Then uses a safe cause fallback', () => {
    expect(
      createDataAccessError('validation', 'Invalid document', Symbol('bad')),
    ).toMatchObject({ message: 'Invalid document: <unserializable cause>' });
  });
});
