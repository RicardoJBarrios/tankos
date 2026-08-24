import * as publicApi from './index';
import { describe, expect, it } from 'vitest';

describe('data-access-ui public entry point', () => {
  it('Given the package entry point, When imported, Then exposes the CRUD list API', () => {
    expect(publicApi.createCrudListStore).toEqual(expect.any(Function));
    expect(publicApi.CrudListComponent).toBeDefined();
  });
});
