import { TestBed } from '@angular/core/testing';
import { DecimalService } from '../../application';
import type { DecimalArithmeticPort } from '../../core';
import { createBigJsDecimalAdapter } from '../../adapters/big-js';
import { provideTankOsDecimal } from './decimal-providers';

describe('decimal providers', () => {
  it('Given the Big.js port, When the selected providers are registered, Then DecimalService is usable', () => {
    TestBed.configureTestingModule({
      providers: provideTankOsDecimal(createBigJsDecimalAdapter()),
    });

    expect(TestBed.inject(DecimalService).decimal('1').add('2').value).toBe(
      '3',
    );
  });

  it('Given a custom arithmetic port, When registered, Then DecimalService uses it', () => {
    const arithmetic: DecimalArithmeticPort = {
      add: () => '3' as never,
      subtract: () => '0' as never,
      multiply: () => '0' as never,
      divide: () => '0' as never,
      remainder: () => '0' as never,
      power: () => '0' as never,
      negate: () => '0' as never,
      compare: () => 0,
    };

    TestBed.configureTestingModule({
      providers: provideTankOsDecimal(arithmetic),
    });

    expect(TestBed.inject(DecimalService).decimal('1').add('2').value).toBe(
      '3',
    );
  });
});
