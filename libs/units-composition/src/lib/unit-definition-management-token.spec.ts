import { describe, expect, it } from 'vitest';
import { UNIT_DEFINITION_MANAGEMENT_SERVICE } from './unit-definition-management-token';

describe('UNIT_DEFINITION_MANAGEMENT_SERVICE', () => {
  it('exposes a stable Angular composition token', () => {
    expect(UNIT_DEFINITION_MANAGEMENT_SERVICE.toString()).toContain(
      'UNIT_DEFINITION_MANAGEMENT_SERVICE',
    );
  });
});
