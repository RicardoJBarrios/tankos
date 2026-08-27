import { describe, expect, it } from 'vitest';
import { LOGGER } from './logger-token';

describe('LOGGER', () => {
  it('exposes a stable Angular composition token', () => {
    expect(LOGGER.toString()).toContain('LOGGER');
  });
});
