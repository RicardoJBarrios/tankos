import {
  DimensionSignatureError,
  UnitCodeError,
  UnitError,
} from './unit-errors';

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

  it('Given an invalid exponent, When represented, Then identifies the dimension', () => {
    const error = new DimensionSignatureError('length', NaN);

    expect(error).toMatchObject({
      name: 'DimensionSignatureError',
      code: 'DIMENSION_SIGNATURE_INVALID',
    });
  });
});
