import { createBigJsDecimalAdapter } from '@tankos/decimal-big-js';
import {
  createDecimalContext,
  DecimalDivisionByZeroError,
  normalizeDecimalInput,
} from '@tankos/decimal';
import {
  createConversionDefinition,
  createUnitCode,
  createUnitDefinition,
  createUnitRepresentation,
  type UnitCataloguePort,
} from '../core';
import { createUnitConversionService } from './unit-conversion-service';

describe('createUnitConversionService', () => {
  const arithmetic = createBigJsDecimalAdapter();
  const catalogue = createTestCatalogue();
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
        origin: 'standard',
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
        origin: 'standard',
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
        origin: 'standard',
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
        origin: 'standard',
        family: 'temperature',
        kind: 'affine',
        factor: { numerator: '1', denominator: '1' },
        offset: { numerator: '1', denominator: '0' },
        provenance: 'test',
      }),
    ).toThrow('Conversion offset denominator must not be zero');
  });

  it('Given units without a declared conversion, When conversion is requested, Then reports that the conversion is unavailable', () => {
    const service = createService([]);

    expectCode(
      () =>
        service.convert({
          value: '1',
          ...units('UN/CEFACT:LTR', 'UN/CEFACT:KGM'),
        }),
      'UNIT_CONVERSION_UNAVAILABLE',
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

  it('Given a non-unit denominator without a division context, When conversion is requested, Then reports the missing context', () => {
    const service = createService([
      conversion(
        'volume-litre-to-millilitre',
        'UN/CEFACT:LTR',
        'UN/CEFACT:MLT',
        '1000',
        '2',
      ),
    ]);

    expectCode(
      () =>
        service.convert({
          value: '1',
          ...units('UN/CEFACT:LTR', 'UN/CEFACT:MLT'),
        }),
      'UNIT_CONVERSION_CONTEXT_REQUIRED',
    );
  });

  it('Given an arithmetic provider that reports division by zero, When conversion is requested, Then maps it to a unit error', () => {
    const service = createUnitConversionService({
      arithmetic: {
        ...arithmetic,
        divide: () => {
          throw new DecimalDivisionByZeroError();
        },
      },
      catalogue,
      definitions: [
        createConversionDefinition({
          ...units('UN/CEFACT:LTR', 'UN/CEFACT:MLT'),
          code: 'zero-provider',
          version: '1',
          origin: 'custom',
          family: 'volume',
          kind: 'linear',
          factor: { numerator: '1', denominator: '2' },
          offset: '0',
          divisionContext: createDecimalContext(2, 'half-up'),
          provenance: 'test',
        }),
      ],
    });

    expectCode(
      () =>
        service.convert({
          value: '1',
          ...units('UN/CEFACT:LTR', 'UN/CEFACT:MLT'),
        }),
      'UNIT_CONVERSION_DENOMINATOR_ZERO',
    );
  });

  it('Given an arithmetic provider failure unrelated to division by zero, When conversion is requested, Then propagates the provider error', () => {
    const providerError = new Error('provider-failure');
    const service = createUnitConversionService({
      arithmetic: {
        ...arithmetic,
        divide: () => {
          throw providerError;
        },
      },
      catalogue,
      definitions: [
        createConversionDefinition({
          ...units('UN/CEFACT:LTR', 'UN/CEFACT:MLT'),
          code: 'provider-failure',
          version: '1',
          origin: 'custom',
          family: 'volume',
          kind: 'linear',
          factor: { numerator: '1', denominator: '2' },
          offset: '0',
          divisionContext: createDecimalContext(2, 'half-up'),
          provenance: 'test',
        }),
      ],
    });

    expect(() =>
      service.convert({
        value: '1',
        ...units('UN/CEFACT:LTR', 'UN/CEFACT:MLT'),
      }),
    ).toThrow(providerError);
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
      origin: 'standard',
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

  function createTestCatalogue(): UnitCataloguePort {
    const definitions = [
      'UN/CEFACT:LTR',
      'UN/CEFACT:MLT',
      'UN/CEFACT:KGM',
      'UN/CEFACT:CEL',
      'UN/CEFACT:KEL',
      'UN/CEFACT:FAH',
    ].map((code) =>
      createUnitDefinition({
        code: createUnitCode(code),
        system: 'metric',
        representation: createUnitRepresentation({
          symbol: code.slice(-3),
          asciiFallback: code.slice(-3),
          position: 'suffix',
          spacing: 'normal',
        }),
        catalogueVersion: 'test',
      }),
    );

    return {
      list: () => definitions,
      find: (code) =>
        definitions.find((definition) => definition.code === code),
    };
  }
});
