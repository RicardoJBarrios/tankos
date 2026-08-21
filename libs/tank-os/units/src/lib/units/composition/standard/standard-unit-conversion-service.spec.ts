import { createBigJsDecimalAdapter } from '@tank-os/decimal-big-js';
import { createStandardUnitConversionService } from './standard-unit-conversion-service';

describe('createStandardUnitConversionService', () => {
  it('Given the standard adapter, When litres are converted to millilitres, Then exposes the standard exact conversion', () => {
    const service = createStandardUnitConversionService(
      createBigJsDecimalAdapter(),
    );

    expect(
      service.convert({
        value: '2.5',
        sourceUnit: 'UN/CEFACT:LTR',
        targetUnit: 'UN/CEFACT:MLT',
      }),
    ).toMatchObject({
      value: '2500',
      conversionCode: 'volume-litre-to-millilitre',
    });
  });

  it('Given the standard adapter, When Fahrenheit is converted to Celsius, Then evaluates the rational affine conversion', () => {
    const service = createStandardUnitConversionService(
      createBigJsDecimalAdapter(),
    );

    expect(
      service.convert({
        value: '212',
        sourceUnit: 'UN/CEFACT:FAH',
        targetUnit: 'UN/CEFACT:CEL',
      }).value,
    ).toBe('100');
  });
});
