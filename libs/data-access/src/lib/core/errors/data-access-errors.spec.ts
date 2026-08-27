import { createDataAccessError, DataAccessError } from './data-access-errors';

describe('DataAccessError', () => {
  it('Given a data-access failure, When created, Then exposes its stable code', () => {
    const error = new DataAccessError('transient', 'message', {
      retryable: true,
    });

    expect(error).toMatchObject({
      name: 'DataAccessError',
      code: 'transient',
      message: 'message',
      retryable: true,
    });
  });

  it('Given no retry policy, When created, Then defaults to non-retryable', () => {
    expect(new DataAccessError('validation', 'invalid').retryable).toBe(false);
  });

  it('Given a transient provider cause, When normalized, Then keeps a safe message and a private cause', () => {
    const result = createDataAccessError(
      'transient',
      'failed',
      new Error('offline'),
    );
    expect(result).toMatchObject({
      code: 'transient',
      retryable: true,
      message: 'failed',
    });
    expect(result.cause).toBeInstanceOf(Error);
  });

  it('Given a provider cause, When normalized, Then does not expose it through enumerable fields', () => {
    const result = createDataAccessError('permanent', 'failed', 'bad-config');
    expect(result.message).toBe('failed');
    expect(Object.keys(result)).not.toContain('cause');
  });

  it('Given a structured cause, When normalized, Then retains it only for diagnostics', () => {
    const cause = { reason: 'bad-config' };
    const result = createDataAccessError('permanent', 'failed', cause);
    expect(result.message).toBe('failed');
    expect(result.cause).toBe(cause);
  });
});
