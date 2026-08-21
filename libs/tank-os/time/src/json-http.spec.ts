import { createJsonHttpTimeAdapter } from './json-http';

describe('JSON/HTTP entry point', () => {
  it('Given the JSON/HTTP entry point, When importing it, Then it exposes its adapter factory', () => {
    expect(createJsonHttpTimeAdapter).toEqual(expect.any(Function));
  });
});
