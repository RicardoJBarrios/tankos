import { ErrorHandler } from '@angular/core';
import { DataAccessError } from '@tankos/data-access';
import { DecimalError } from '@tankos/decimal';
import { UnitError } from '@tankos/units';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import {
  UNIT_DEFINITION_MANAGEMENT_SERVICE,
  UnitDefinitionFeatureService,
} from '@tankos/units-ui';
import { appConfig } from './app.config';

describe('appConfig', () => {
  it('Given the application configuration, When its providers are inspected, Then the TankOS platform providers are registered', () => {
    expect(appConfig.providers).toHaveLength(13);
  });

  it('provides the units service through the application composition', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });

    expect(TestBed.inject(UNIT_DEFINITION_MANAGEMENT_SERVICE)).toBeDefined();
    expect(TestBed.inject(UnitDefinitionFeatureService)).toBeDefined();
  });

  it('reports unexpected errors at the application boundary', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    TestBed.configureTestingModule({ providers: appConfig.providers });

    TestBed.inject(ErrorHandler).handleError(new Error('unexpected'));

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('normalizes library errors before reporting them', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    TestBed.configureTestingModule({ providers: appConfig.providers });

    TestBed.inject(ErrorHandler).handleError(
      new DataAccessError('conflict', 'duplicate code'),
    );

    expect(consoleError).toHaveBeenCalledWith(
      '[TankOS error]',
      expect.objectContaining({ code: 'conflict' }),
    );
    consoleError.mockRestore();
  });

  it('normalizes every registered library error category', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    TestBed.configureTestingModule({ providers: appConfig.providers });
    const handler = TestBed.inject(ErrorHandler);
    const cases = [
      ['not-found', 'not-found'],
      ['validation', 'validation'],
      ['conflict', 'conflict'],
      ['forbidden', 'permission-denied'],
      ['transient', 'network'],
      ['permanent', 'persistence'],
      ['lifecycle', 'conflict'],
    ] as const;

    for (const [source, code] of cases) {
      handler.handleError(new DataAccessError(source, 'library failure'));
      expect(consoleError).toHaveBeenLastCalledWith(
        '[TankOS error]',
        expect.objectContaining({ code }),
      );
    }
    handler.handleError(new UnitError('UNIT_INVALID', 'invalid unit'));
    handler.handleError(new DecimalError('DECIMAL_INVALID', 'invalid decimal'));

    expect(consoleError).toHaveBeenCalledTimes(cases.length + 2);
    consoleError.mockRestore();
  });
});
