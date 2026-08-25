import { describe, expect, it } from 'vitest';
import { provideTankOsTime } from './tankos-providers';

describe('provideTankOsTime', () => {
  it('Given the default Angular integration, When providers are created, Then it returns the complete temporal provider set', () => {
    expect(provideTankOsTime()).toHaveLength(4);
  });
});
