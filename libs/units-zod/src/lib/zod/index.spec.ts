import * as publicApi from './index';

describe('Units Zod adapter barrel', () => {
  it('Given the adapter barrel, When imported, Then exposes every schema', () => {
    expect(Object.keys(publicApi).sort()).toEqual([
      'conversionDefinitionDtoSchema',
      'conversionDefinitionSchema',
      'conversionDefinitionToDto',
      'unitDefinitionDtoSchema',
      'unitDefinitionSchema',
      'unitDefinitionSearchToken',
      'unitDefinitionToDto',
    ]);
  });
});
