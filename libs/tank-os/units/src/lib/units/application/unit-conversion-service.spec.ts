import { createBigJsDecimalAdapter } from '@tank-os/decimal/big-js';
import {
  createDecimalContext,
  normalizeDecimalInput,
} from '@tank-os/decimal';
import { createStandardUnitCatalogue } from '../adapters/standard';
import { createConversionDefinition, createUnitCode } from '../core';
import { createUnitConversionService } from './unit-conversion-service';

describe('createUnitConversionService', () => {
  const arithmetic = createBigJsDecimalAdapter();
  const catalogue = createStandardUnitCatalogue();
  const units = (source: string, target: string) => ({
    sourceUnit: createUnitCode(source),
    targetUnit: createUnitCode(target),
  });

  it('Given a linear conversion, When a litre value is converted to millilitres, Then returns the exact target value and definition identity', () => {
    const service = createService([
      conversion(
        'volume-litre-to-millilitre',
        'UN/CEFACT:LTR',
        'UN/CEFACT:MLT',
        '1000',
        '1',
      ),
    ]);

    expect(
      service.convert({
        value: '2.5',
        ...units('UN/CEFACT:LTR', 'UN/CEFACT:MLT'),
      }),
    ).toEqual({
      value: '2500',
      sourceUnit: 'UN/CEFACT:LTR',
      targetUnit: 'UN/CEFACT:MLT',
      conversionCode: 'volume-litre-to-millilitre',
      conversionVersion: '1',
    });
  });

  it('Given an affine conversion, When Celsius is converted to Kelvin, Then applies the factor and offset', () => {
    const service = createService([
      createConversionDefinition({
        ...units('UN/CEFACT:CEL', 'UN/CEFACT:KEL'),
        code: 'temperature-celsius-to-kelvin',
        version: '1',
        family: 'temperature',
        kind: 'affine',
        factor: { numerator: '1', denominator: '1' },
        offset: '273.15',
        provenance: 'UN/CEFACT-Rev17-aquarium-core',
      }),
    ]);

    expect(
      service.convert({ value: 25, ...units('UN/CEFACT:CEL', 'UN/CEFACT:KEL') })
        .value,
    ).toBe('298.15');
  });

  it('Given a rational conversion with a repeating result, When a context is supplied, Then applies the declared rounding policy', () => {
    const service = createService([
      createConversionDefinition({
        ...units('UN/CEFACT:CEL', 'UN/CEFACT:FAH'),
        code: 'temperature-celsius-to-fahrenheit',
        version: '1',
        family: 'temperature',
        kind: 'affine',
        factor: { numerator: '9', denominator: '5' },
        offset: '32',
        divisionContext: createDecimalContext(2, 'half-up'),
        provenance: 'UN/CEFACT-Rev17-aquarium-core',
      }),
    ]);

    expect(
      service.convert({
        value: '10',
        ...units('UN/CEFACT:CEL', 'UN/CEFACT:FAH'),
      }).value,
    ).toBe('50');
  });

  it('Given a rational affine offset, When Fahrenheit is converted to Celsius, Then applies the rational offset without losing precision', () => {
    const service = createService([
      createConversionDefinition({
        ...units('UN/CEFACT:FAH', 'UN/CEFACT:CEL'),
        code: 'temperature-fahrenheit-to-celsius',
        version: '1',
        family: 'temperature',
        kind: 'affine',
        factor: { numerator: '5', denominator: '9' },
        offset: { numerator: '-160', denominator: '9' },
        divisionContext: createDecimalContext(4, 'half-up'),
        provenance: 'UN/CEFACT-Rev17-aquarium-core',
      }),
    ]);

    expect(
      service.convert({
        value: '212',
        ...units('UN/CEFACT:FAH', 'UN/CEFACT:CEL'),
      }).value,
    ).toBe('100');
  });

  it('Given an invalid rational offset, When the definition is created, Then rejects a zero denominator', () => {
    expect(() =>
      createConversionDefinition({
        ...units('UN/CEFACT:FAH', 'UN/CEFACT:CEL'),
        code: 'invalid-offset',
        version: '1',
        family: 'temperature',
        kind: 'affine',
        factor: { numerator: '1', denominator: '1' },
        offset: { numerator: '1', denominator: '0' },
        provenance: 'test',
      }),
    ).toThrow('Conversion offset denominator must not be zero');
  });

  it('Given incompatible units, When conversion is requested, Then throws a structured incompatibility error', () => {
    const service = createService([]);

    expectCode(
      () =>
        service.convert({
          value: '1',
          ...units('UN/CEFACT:LTR', 'UN/CEFACT:KGM'),
        }),
      'UNIT_CONVERSION_INCOMPATIBLE',
    );
  });

  it('Given compatible units without a declared definition, When conversion is requested, Then reports that the conversion is unavailable', () => {
    const service = createService([]);

    expectCode(
      () =>
        service.convert({
          value: '1',
          ...units('UN/CEFACT:LTR', 'UN/CEFACT:MLT'),
        }),
      'UNIT_CONVERSION_UNAVAILABLE',
    );
  });

  it('Given an unknown unit code, When conversion is requested, Then reports that the unit is unknown', () => {
    const service = createService([]);

    expectCode(
      () =>
        service.convert({
          value: '1',
          ...units('UN/CEFACT:UNKNOWN', 'UN/CEFACT:MLT'),
        }),
      'UNIT_CONVERSION_UNIT_UNKNOWN',
    );
  });

  function createService(
    definitions: readonly ReturnType<typeof createConversionDefinition>[],
  ) {
    return createUnitConversionService({ arithmetic, catalogue, definitions });
  }

  function conversion(
    code: string,
    sourceUnit: string,
    targetUnit: string,
    numerator: string,
    denominator: string,
  ) {
    return createConversionDefinition({
      ...units(sourceUnit, targetUnit),
      code,
      version: '1',
      family: 'volume',
      kind: 'linear',
      factor: { numerator, denominator },
      offset: normalizeDecimalInput('0'),
      provenance: 'UN/CEFACT-Rev17-aquarium-core',
    });
  }

  function expectCode(action: () => unknown, code: string): void {
    let error: unknown;
    try {
      action();
    } catch (caught) {
      error = caught;
    }

    expect(error).toMatchObject({ code });
  }
});
