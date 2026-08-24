import * as publicApi from './index';

describe('Decimal Big.js entry point', () => {
  it('Given the Big.js entry point, When imported, Then exposes the adapter and provider composition', () => {
    expect(publicApi.createBigJsDecimalAdapter).toEqual(expect.any(Function));
    expect(publicApi.provideTankOsDecimalWithBigJs).toEqual(
      expect.any(Function),
    );
  });
});
