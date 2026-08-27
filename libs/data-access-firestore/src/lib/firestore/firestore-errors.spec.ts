import { describe, expect, it } from 'vitest';
import { createDataAccessError } from './firestore-errors';

describe('createDataAccessError', () => {
  it('Given a transient provider failure, When mapped, Then preserves retryability without exposing the provider message', () => {
    const result = createDataAccessError(
      'transient',
      'Firestore failed',
      new Error('network down'),
    );

    expect(result).toMatchObject({
      name: 'DataAccessError',
      code: 'transient',
      retryable: true,
      message: 'Firestore failed',
    });
    expect(result.cause).toBeInstanceOf(Error);
  });

  it('Given a non-error provider value, When mapped, Then keeps a stable message without marking it retryable', () => {
    const result = createDataAccessError(
      'validation',
      'Invalid document',
      'bad payload',
    );

    expect(result).toMatchObject({
      code: 'validation',
      retryable: false,
      message: 'Invalid document',
    });
    expect(result.cause).toBe('bad payload');
  });

  it('Given no provider cause, When mapped, Then keeps the stable message unchanged', () => {
    expect(createDataAccessError('not-found', 'Missing document').message).toBe(
      'Missing document',
    );
  });

  it('Given a structured provider value, When mapped, Then retains it only as a diagnostic cause', () => {
    const cause = { reason: 'bad' };
    const result = createDataAccessError(
      'validation',
      'Invalid document',
      cause,
    );
    expect(result).toMatchObject({ message: 'Invalid document' });
    expect(result.cause).toBe(cause);
  });

  it('Given an unserializable provider value, When mapped, Then retains the diagnostic value without changing the public message', () => {
    const cause = Symbol('bad');
    const result = createDataAccessError(
      'validation',
      'Invalid document',
      cause,
    );
    expect(result).toMatchObject({ message: 'Invalid document' });
    expect(result.cause).toBe(cause);
  });
});
