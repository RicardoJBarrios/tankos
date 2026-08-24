import * as publicApi from './index';

describe('Units Zod public entry point', () => {
  it('Given the public entry point, When imported, Then exposes the unit DTO schema', () => {
    expect(publicApi.unitDefinitionDtoSchema).toBeDefined();
  });

  it('Given the public entry point, When imported, Then exposes the unit domain schema', () => {
    expect(publicApi.unitDefinitionSchema).toBeDefined();
  });

  it('Given the public entry point, When imported, Then exposes the conversion DTO schema', () => {
    expect(publicApi.conversionDefinitionDtoSchema).toBeDefined();
  });

  it('Given the public entry point, When imported, Then exposes the conversion domain schema', () => {
    expect(publicApi.conversionDefinitionSchema).toBeDefined();
  });

  it('Given the public entry point, When imported, Then exposes both DTO mappers', () => {
    expect(publicApi.unitDefinitionToDto).toBeTypeOf('function');
    expect(publicApi.conversionDefinitionToDto).toBeTypeOf('function');
  });
});
