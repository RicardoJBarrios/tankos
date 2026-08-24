import { describe, expect, it } from 'vitest';
import * as api from './index';

describe('JSON/HTTP adapter barrel', () => {
  it('Given the adapter barrel, When imported, Then exposes only its public factories and schemas', () => {
    expect(Object.keys(api).sort()).toEqual([
      'conversionDefinitionDtoSchema',
      'createConversionDefinitionJsonHttpRepository',
      'createUnitDefinitionJsonHttpRepository',
      'createUnitsJsonHttpRecordSchemas',
      'unitDefinitionDtoSchema',
    ]);
  });
});
