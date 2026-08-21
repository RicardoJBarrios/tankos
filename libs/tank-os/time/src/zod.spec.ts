import * as publicApi from './zod';

describe('Time Zod entry point', () => {
  it('Given the Zod entry point, When imported, Then exposes the temporal schemas factory', () => {
    expect(publicApi.createZodTimeSchemas).toEqual(expect.any(Function));
  });
});
