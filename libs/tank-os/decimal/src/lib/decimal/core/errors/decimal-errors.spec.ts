import {
  DecimalContextError,
  DecimalAdapterError,
  DecimalDivisionByZeroError,
  DecimalError,
  DecimalRangeError,
  InvalidDecimalError,
} from './decimal-errors';

describe('Decimal errors', () => {
  it('Given a base decimal error, When created, Then exposes its stable code', () => {
    const error = new DecimalError('CUSTOM', 'Custom error');

    expect(error.name).toBe('DecimalError');
    expect(error.code).toBe('CUSTOM');
    expect(error.message).toBe('Custom error');
  });

  it('Given an invalid input, When represented as an error, Then includes its value', () => {
    const error = new InvalidDecimalError('bad');

    expect(error.name).toBe('InvalidDecimalError');
    expect(error.code).toBe('INVALID_DECIMAL');
    expect(error.message).toContain('bad');
  });

  it('Given an invalid context, When represented as an error, Then exposes the context code', () => {
    const error = new DecimalContextError('bad context');

    expect(error.name).toBe('DecimalContextError');
    expect(error.code).toBe('INVALID_DECIMAL_CONTEXT');
  });

  it('Given a division by zero, When represented as an error, Then exposes the division code', () => {
    const error = new DecimalDivisionByZeroError();

    expect(error.name).toBe('DecimalDivisionByZeroError');
    expect(error.code).toBe('DECIMAL_DIVISION_BY_ZERO');
  });

  it('Given an adapter failure, When represented as an error, Then preserves only the safe operation metadata', () => {
    const error = new DecimalAdapterError('add');

    expect(error.name).toBe('DecimalAdapterError');
    expect(error.code).toBe('DECIMAL_ADAPTER_FAILURE');
    expect(error.operation).toBe('add');
  });

  it('Given an oversized result, When represented as an error, Then exposes the range code', () => {
    const error = new DecimalRangeError('multiply');

    expect(error.name).toBe('DecimalRangeError');
    expect(error.code).toBe('DECIMAL_RANGE_EXCEEDED');
  });
});
