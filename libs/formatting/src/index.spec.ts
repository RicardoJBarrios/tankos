import { describe, expect, it } from 'vitest';
import * as formatting from './index';

describe('formatting public API', () => {
  it('Given the formatting entrypoint, When its exports are read, Then the public text formatters are available', () => {
    expect(formatting.padLeft).toBeTypeOf('function');
    expect(formatting.trimTrailingZeros).toBeTypeOf('function');
  });
});
