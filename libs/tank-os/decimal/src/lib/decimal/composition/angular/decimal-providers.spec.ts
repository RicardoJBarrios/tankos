import { TestBed } from '@angular/core/testing';
import { DecimalService } from '../../application';
import type { DecimalArithmeticPort } from '../../core';
import { provideTankOsDecimal } from './decimal-providers';

describe('decimal providers', () => {
  it('Given no custom port, When the default providers are registered, Then DecimalService is usable', () => {
    TestBed.configureTestingModule({ providers: provideTankOsDecimal() });

    expect(TestBed.inject(DecimalService).add('1', '2')).toBe('3');
  });

  it('Given a custom arithmetic port, When registered, Then DecimalService uses it', () => {
    const arithmetic: DecimalArithmeticPort = {
      add: () => 'custom' as never,
      subtract: () => '0' as never,
      multiply: () => '0' as never,
      divide: () => '0' as never,
      compare: () => 0,
    };

    TestBed.configureTestingModule({
      providers: provideTankOsDecimal(arithmetic),
    });

    expect(TestBed.inject(DecimalService).add('1', '2')).toBe('custom');
  });
});
