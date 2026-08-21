import { DataAccessError } from './data-access-errors';

describe('DataAccessError', () => {
  it('Given a data-access failure, When created, Then exposes its stable code', () => {
    const error = new DataAccessError('DATA_ACCESS_FAILED', 'message');

    expect(error).toMatchObject({
      name: 'DataAccessError',
      code: 'DATA_ACCESS_FAILED',
      message: 'message',
    });
  });
});
