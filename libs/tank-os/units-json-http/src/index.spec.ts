import {
  createConversionDefinitionJsonHttpRepository,
  createUnitDefinitionJsonHttpRepository,
  createUnitsJsonHttpRecordSchemas,
} from './index';
import { describe, expect, it } from 'vitest';

describe('JSON/HTTP public entry point', () => {
  it('Given the package entry point, When imported, Then exposes the unit adapter API', () => {
    expect(createConversionDefinitionJsonHttpRepository).toBeTypeOf('function');
    expect(createUnitDefinitionJsonHttpRepository).toBeTypeOf('function');
    expect(createUnitsJsonHttpRecordSchemas).toBeTypeOf('function');
  });
});
