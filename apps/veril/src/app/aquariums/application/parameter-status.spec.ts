import { describe, expect, it } from 'vitest';
import { ParameterTarget } from '../domain/aquarium';
import {
  currentParameterStateFor,
  parameterStatusFor,
} from './parameter-status';

const target = ParameterTarget.create({
  parameterId: 'temperature',
  minimum: 24,
  maximum: 25,
});

describe('parameterStatusFor', () => {
  it.each([
    [23.9, 'below'],
    [24, 'within'],
    [24.5, 'within'],
    [25, 'within'],
    [25.1, 'above'],
  ] as const)('classifies %s as %s', (value, expected) => {
    expect(parameterStatusFor(value, target)).toBe(expected);
  });

  it('supports an exact target and decimal values', () => {
    const exactTarget = ParameterTarget.create({
      parameterId: 'temperature',
      minimum: 25.4,
      maximum: 25.4,
    });

    expect(parameterStatusFor(25.4, exactTarget)).toBe('within');
    expect(parameterStatusFor(25.39, exactTarget)).toBe('below');
    expect(parameterStatusFor(25.41, exactTarget)).toBe('above');
  });
});

describe('currentParameterStateFor', () => {
  const measurement = {
    parameterId: 'temperature' as const,
    canonicalValue: 25.4,
    canonicalUnit: 'celsius' as const,
    measuredAt: new Date('2026-08-10T10:00:00.000Z'),
  };

  it('combines a Measurement and target with an interpretation', () => {
    const withinMeasurement = { ...measurement, canonicalValue: 24.5 };
    expect(
      currentParameterStateFor('temperature', withinMeasurement, target),
    ).toEqual({
      parameterId: 'temperature',
      measurement: withinMeasurement,
      target,
      interpretation: 'within',
    });
  });

  it('keeps a Measurement without a target uninterpreted', () => {
    expect(
      currentParameterStateFor('temperature', measurement, undefined),
    ).toMatchObject({
      measurement,
      interpretation: 'uninterpreted',
    });
  });

  it('keeps a target visible without interpreting missing data', () => {
    expect(currentParameterStateFor('temperature', null, target)).toEqual({
      parameterId: 'temperature',
      measurement: null,
      target,
      interpretation: undefined,
    });
  });

  it('represents neither Measurement nor target without interpretation', () => {
    expect(currentParameterStateFor('temperature', null, undefined)).toEqual({
      parameterId: 'temperature',
      measurement: null,
      target: undefined,
      interpretation: undefined,
    });
  });
});
