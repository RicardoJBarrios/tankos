import { TestBed } from '@angular/core/testing';
import { DecimalService } from './decimal-service';
import { provideTankOsDecimal } from '../composition';
import { createBigJsDecimalAdapter } from '../adapters/big-js';

describe('DecimalService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTankOsDecimal(createBigJsDecimalAdapter())],
    });
  });

  it('Given a decimal input, When a fluent value is created, Then returns an immutable Decimal with the configured adapter', () => {
    const service = TestBed.inject(DecimalService);

    expect(service.decimal('001.20').add('0.8').value).toBe('2');
  });

  it('Given number input, When a fluent value is created, Then supports native numeric sources', () => {
    expect(TestBed.inject(DecimalService).decimal(2.5).add(1.5).value).toBe(
      '4',
    );
  });

  it('Given decimal precision and rounding, When a context is created, Then returns the immutable operation context', () => {
    const context = TestBed.inject(DecimalService).context(2, 'half-up');

    expect(context).toMatchObject({ decimalPlaces: 2, rounding: 'half-up' });
    expect(Object.isFrozen(context)).toBe(true);
  });
});
