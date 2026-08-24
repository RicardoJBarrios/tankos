import { describe, expect, it } from 'vitest';
import { appConfig } from './app.config';

describe('appConfig', () => {
  it('Given the application configuration, When its providers are inspected, Then the TankOS platform providers are registered', () => {
    expect(appConfig.providers).toHaveLength(4);
  });
});
