import { describe, expect, it } from 'vitest';
import { aquariumIdFrom } from '../../shared/domain/aquarium-reference';
import {
  canonicalUnitFor,
  createMeasurement,
  measurementIdFrom,
} from './measurement';

const input = {
  id: measurementIdFrom('123e4567-e89b-42d3-a456-426614174000'),
  aquariumId: aquariumIdFrom('123e4567-e89b-42d3-a456-426614174001'),
  parameterId: 'temperature' as const,
  enteredValue: 23.5,
  enteredUnit: 'celsius' as const,
  canonicalValue: 23.5,
  canonicalUnit: 'celsius' as const,
  measuredAt: new Date('2026-08-08T10:00:00.000Z'),
  recordedAt: new Date('2026-08-08T10:05:00.000Z'),
  provenance: 'manual' as const,
};

describe('Measurement', () => {
  it('creates valid durable quantitative evidence', () => {
    expect(createMeasurement(input)).toEqual(input);
  });

  it.each([
    ['temperature', 'celsius'],
    ['salinity', 'parts-per-thousand'],
    ['alkalinity', 'degrees-kh'],
    ['nitrate', 'milligrams-per-litre-as-no3'],
    ['phosphate', 'milligrams-per-litre-as-po4'],
  ] as const)('maps %s to its canonical Unit', (parameterId, unit) => {
    expect(canonicalUnitFor(parameterId)).toBe(unit);
  });

  it('accepts zero as a valid value', () => {
    expect(
      createMeasurement({ ...input, enteredValue: 0, canonicalValue: 0 }),
    ).toMatchObject({ enteredValue: 0, canonicalValue: 0 });
  });

  it.each([NaN, Infinity, -Infinity, -1])(
    'rejects invalid numeric value %s',
    (value) => {
      expect(() =>
        createMeasurement({
          ...input,
          enteredValue: value,
          canonicalValue: value,
        }),
      ).toThrow();
    },
  );

  it('rejects a Unit incompatible with the Parameter', () => {
    expect(() =>
      createMeasurement({
        ...input,
        parameterId: 'salinity',
        enteredUnit: 'celsius',
        canonicalUnit: 'celsius',
      }),
    ).toThrow('Measurement unit is incompatible');
  });

  it('rejects invalid time and non-manual provenance', () => {
    expect(() =>
      createMeasurement({ ...input, measuredAt: new Date('invalid') }),
    ).toThrow('measuredAt must be a valid date');
    expect(() =>
      createMeasurement({ ...input, provenance: 'sensor' as never }),
    ).toThrow('provenance must be manual');
  });
});
