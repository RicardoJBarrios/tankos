import { UnitConversionError, UnitCodeError, UnitError } from './unit-errors';

describe('unit errors', () => {
  it('Given a unit error, When created, Then exposes its stable code', () => {
    const error = new UnitError('TEST', 'message');

    expect(error).toMatchObject({
      name: 'UnitError',
      code: 'TEST',
      message: 'message',
    });
  });

  it('Given an invalid code, When represented, Then identifies the failure', () => {
    const error = new UnitCodeError('bad code');

    expect(error).toMatchObject({
      name: 'UnitCodeError',
      code: 'UNIT_CODE_INVALID',
    });
  });

  it('Given a conversion failure, When represented, Then preserves its conversion code and name', () => {
    const error = new UnitConversionError('CONVERSION_FAILED', 'message');

    expect(error).toMatchObject({
      name: 'UnitConversionError',
      code: 'CONVERSION_FAILED',
      message: 'message',
    });
  });
});
