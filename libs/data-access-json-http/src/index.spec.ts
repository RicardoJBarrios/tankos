import { describe, expect, it } from 'vitest';
import { createJsonHttpCrudRepository } from './index';

describe('JSON/HTTP public entry point', () => {
  it('Given the JSON/HTTP entry point, When imported, Then exposes its repository factory', () => {
    expect(createJsonHttpCrudRepository).toEqual(expect.any(Function));
  });
});
