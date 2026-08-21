import * as publicApi from './zod';

describe('Decimal Zod entry point', () => {
  it('Given the Zod entry point, When imported, Then exposes the Decimal schemas', () => {
    expect(publicApi.decimalValueSchema).toBeDefined();
    expect(publicApi.decimalInputSchema).toBeDefined();
    expect(publicApi.decimalContextSchema).toBeDefined();
  });
});
