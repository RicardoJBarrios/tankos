import { describe, expect, it } from 'vitest';
import {
  createCrudRepositoryToken,
  createCrudServiceToken,
} from './data-access-tokens';

describe('createCrudRepositoryToken', () => {
  it('Given a description, When creating a repository token, Then returns an Angular injection token', () => {
    const token = createCrudRepositoryToken('TEST_REPOSITORY');

    expect(token).toBeDefined();
    expect(token.toString()).toContain('TEST_REPOSITORY');
  });
});

describe('createCrudServiceToken', () => {
  it('Given a description, When creating a service token, Then returns an Angular injection token', () => {
    const token = createCrudServiceToken('TEST_SERVICE');

    expect(token).toBeDefined();
    expect(token.toString()).toContain('TEST_SERVICE');
  });
});
