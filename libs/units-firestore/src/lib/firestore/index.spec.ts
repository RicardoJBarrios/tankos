import * as publicApi from './index';

describe('Units Firestore adapter barrel', () => {
  it('Given the adapter barrel, When imported, Then exposes the repository factories', () => {
    expect(Object.keys(publicApi).sort()).toEqual([
      'conversionDefinitionRecordSchema',
      'createConversionDefinitionFirestoreRepository',
      'createDefaultUnitDefinitionFirestoreRepository',
      'createUnitDefinitionFirestoreRepository',
      'unitDefinitionRecordSchema',
    ]);
  });
});
