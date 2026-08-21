import { TestBed } from '@angular/core/testing';
import { DecimalService } from './decimal-service';
import { provideTankOsDecimal } from '../composition';
import { InvalidDecimalError } from '../core';

describe('DecimalService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTankOsDecimal()] });
  });

  it('Given decimal inputs, When normalized, Then returns canonical values', () => {
    expect(TestBed.inject(DecimalService).normalize('001.20')).toBe('1.2');
  });

  it('Given an invalid input, When normalized through the service, Then preserves the shared input error', () => {
    expect(() => TestBed.inject(DecimalService).normalize('invalid')).toThrow(
      InvalidDecimalError,
    );
  });

  it('Given decimal inputs, When added, Then delegates to the configured adapter', () => {
    expect(TestBed.inject(DecimalService).add('0.1', '0.2')).toBe('0.3');
  });

  it('Given decimal inputs, When subtracted, Then returns the adapter result', () => {
    expect(TestBed.inject(DecimalService).subtract('1', '0.1')).toBe('0.9');
  });

  it('Given decimal inputs, When multiplied, Then returns the adapter result', () => {
    expect(TestBed.inject(DecimalService).multiply('2', '0.5')).toBe('1');
  });

  it('Given a context, When dividing, Then returns the rounded adapter result', () => {
    const service = TestBed.inject(DecimalService);

    expect(service.divide('1', '3', service.context(2, 'half-up'))).toBe(
      '0.33',
    );
  });

  it('Given decimal inputs, When compared, Then returns their ordering', () => {
    expect(TestBed.inject(DecimalService).compare('1', '2')).toBe(-1);
  });
});
