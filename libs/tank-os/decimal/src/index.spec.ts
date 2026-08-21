import * as publicApi from './index';
import type { DecimalArithmeticPort, DecimalValue } from './index';

describe('Decimal public entry point', () => {
  it('Given the public entry point, When imported, Then exposes the Decimal service and provider', () => {
    expect(publicApi.DecimalService).toEqual(expect.any(Function));
    expect(publicApi.provideTankOsDecimal).toEqual(expect.any(Function));
  });

  it('Given the public entry point, When imported, Then exposes the supported rounding modes', () => {
    expect(publicApi.ROUNDING_MODES).toEqual([
      'up',
      'down',
      'half-up',
      'half-even',
      'ceil',
      'floor',
    ]);
  });

  it('Given the public entry point, When a port is implemented, Then its type contract accepts canonical decimal operations', () => {
    const arithmetic: DecimalArithmeticPort = {
      add: (left, right) => `${left}${right}` as DecimalValue,
      subtract: (left) => left,
      multiply: (left) => left,
      divide: (left) => left,
      remainder: (left) => left,
      power: (left) => left,
      negate: (left) => left,
      compare: () => 0,
    };

    expect(arithmetic.add('1' as DecimalValue, '2' as DecimalValue)).toBe('12');
  });

  it('Given the public entry point, When imported, Then exposes the concrete adapter needed by secondary entrypoints', () => {
    expect('createBigJsDecimalAdapter' in publicApi).toBe(true);
  });

  it('Given the public entry point, When imported, Then does not expose the internal Decimal factory or runtime implementation', () => {
    expect('createDecimal' in publicApi).toBe(false);
    expect('DecimalValueObject' in publicApi).toBe(false);
  });
});
