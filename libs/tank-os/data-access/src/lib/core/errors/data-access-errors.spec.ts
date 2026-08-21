import { DataAccessError } from './data-access-errors';

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
});
