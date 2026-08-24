import * as publicApi from './index';

describe('Units Firestore public entry point', () => {
  it('Given the public entry point, When imported, Then exposes both entity repositories', () => {
    expect(publicApi.createUnitDefinitionFirestoreRepository).toBeTypeOf(
      'function',
    );
    expect(publicApi.createConversionDefinitionFirestoreRepository).toBeTypeOf(
      'function',
    );
  });
});
