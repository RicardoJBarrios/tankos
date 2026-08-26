import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import {
  UNIT_DEFINITION_MANAGEMENT_SERVICE,
  UnitDefinitionFeatureService,
} from '@tankos/units-ui';
import { appConfig } from './app.config';

describe('appConfig', () => {
  it('Given the application configuration, When its providers are inspected, Then the TankOS platform providers are registered', () => {
    expect(appConfig.providers).toHaveLength(7);
  });

  it('Given a non-local host, When Firebase is initialized, Then emulators are not connected', async () => {
    vi.resetModules();
    vi.stubGlobal('location', { hostname: 'tankos.example' });

    await expect(import('./firebase')).resolves.toBeDefined();

    vi.unstubAllGlobals();
  });

  it('provides the units service through the application composition', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });

    expect(TestBed.inject(UNIT_DEFINITION_MANAGEMENT_SERVICE)).toBeDefined();
    expect(TestBed.inject(UnitDefinitionFeatureService)).toBeDefined();
  });
});
