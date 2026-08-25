import { TestBed } from '@angular/core/testing';
import { DecimalService } from '../../application';
import type { DecimalArithmeticPort } from '../../core';
import {
  provideDecimalArithmetic,
  provideTankOsDecimal,
} from './decimal-providers';

describe('provideDecimalArithmetic', () => {
  it('Given an arithmetic port, When creating the provider, Then binds the port value', () => {
    const arithmetic = {} as DecimalArithmeticPort;

    expect(provideDecimalArithmetic(arithmetic)).toEqual({
      provide: expect.anything(),
      useValue: arithmetic,
    });
  });
});

describe('decimal providers', () => {
  it('Given an arithmetic port, When the selected providers are registered, Then DecimalService is usable', () => {
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
