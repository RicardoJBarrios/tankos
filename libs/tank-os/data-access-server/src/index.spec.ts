import { describe, expect, it } from 'vitest';
import { createFirebaseAdminBatchAuthorization } from './index';

describe('server public entry point', () => {
  it('Given the server entry point, When its authorization factory is imported, Then it exposes the public adapter contract', () => {
    expect(createFirebaseAdminBatchAuthorization).toBeTypeOf('function');
  });
});
