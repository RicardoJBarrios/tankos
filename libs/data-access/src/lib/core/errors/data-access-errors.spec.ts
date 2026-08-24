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

  it('Given a transient provider cause, When normalized, Then retains retryability and the cause message', () => {
    expect(
      createDataAccessError('transient', 'failed', new Error('offline')),
    ).toMatchObject({
      code: 'transient',
      retryable: true,
      message: 'failed: offline',
    });
  });

  it('Given a non-error cause, When normalized, Then stringifies the cause', () => {
    expect(
      createDataAccessError('permanent', 'failed', 'bad-config').message,
    ).toBe('failed: bad-config');
  });
});
