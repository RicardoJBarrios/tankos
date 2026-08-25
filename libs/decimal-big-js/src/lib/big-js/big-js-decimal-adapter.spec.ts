import {
  DecimalAdapterError,
  DecimalContextError,
  DecimalDivisionByZeroError,
  DecimalRangeError,
  InvalidDecimalError,
  createDecimalContext,
} from '@tankos/decimal';
import { createBigJsDecimalAdapter } from './big-js-decimal-adapter';

describe('createBigJsDecimalAdapter', () => {
  const adapter = createBigJsDecimalAdapter();

  it.each([
    ['0.1', '0.2', '0.3'],
    ['10', '2.5', '12.5'],
  ])(
    'Given two decimals %s and %s, When added, Then returns %s',
    (left, right, expected) => {
      expect(adapter.add(left as never, right as never)).toBe(expected);
    },
  );

  it('Given three decimals, When added, Then accumulates all operands from left to right', () => {
    expect(adapter.add('0.1' as never, '0.2' as never, '0.7' as never)).toBe(
      '1',
    );
  });

  it('Given two decimals, When subtracted, Then returns the exact decimal result', () => {
    expect(adapter.subtract('1' as never, '0.1' as never)).toBe('0.9');
  });

  it('Given three decimals, When subtracted, Then subtracts each following operand sequentially', () => {
    expect(adapter.subtract('10' as never, '2' as never, '3' as never)).toBe(
      '5',
    );
  });

  it('Given two decimals, When multiplied, Then returns the exact decimal result', () => {
    expect(adapter.multiply('0.1' as never, '0.2' as never)).toBe('0.02');
  });

  it('Given three decimals, When multiplied, Then accumulates all operands from left to right', () => {
    expect(adapter.multiply('2' as never, '3' as never, '0.5' as never)).toBe(
      '3',
    );
  });

  it.each([
    ['down', '0.33'],
    ['up', '0.34'],
    ['half-up', '0.33'],
    ['half-even', '0.33'],
    ['ceil', '0.34'],
    ['floor', '0.33'],
  ] as const)(
    'Given 1 divided by 3, When rounded with %s, Then returns %s',
    (rounding, expected) => {
      expect(
        adapter.divide(
          '1' as never,
          '3' as never,
          createDecimalContext(2, rounding),
        ),
      ).toBe(expected);
    },
  );

  it('Given a negative quotient, When ceil and floor are applied, Then use mathematical direction', () => {
    expect(
      adapter.divide(
        '-1' as never,
        '3' as never,
        createDecimalContext(2, 'ceil'),
      ),
    ).toBe('-0.33');
    expect(
      adapter.divide(
        '-1' as never,
        '3' as never,
        createDecimalContext(2, 'floor'),
      ),
    ).toBe('-0.34');
  });

  it('Given three divisors, When divided, Then applies the same context to every sequential division', () => {
    expect(
      adapter.divide(
        '1' as never,
        '3' as never,
        createDecimalContext(4, 'half-up'),
        '2' as never,
      ),
    ).toBe('0.1667');
  });

  it.each([
    ['1', '-3', '-0.33', '-0.34'],
    ['-1', '-3', '0.34', '0.33'],
  ] as const)(
    'Given %s divided by %s, When ceil and floor are applied, Then preserve mathematical direction',
    (left, right, ceilExpected, floorExpected) => {
      expect(
        adapter.divide(
          left as never,
          right as never,
          createDecimalContext(2, 'ceil'),
        ),
      ).toBe(ceilExpected);
      expect(
        adapter.divide(
          left as never,
          right as never,
          createDecimalContext(2, 'floor'),
        ),
      ).toBe(floorExpected);
    },
  );

  it('Given a zero divisor, When divided, Then throws a typed division error', () => {
    expect(() =>
      adapter.divide(
        '1' as never,
        '0' as never,
        createDecimalContext(2, 'down'),
      ),
    ).toThrow(DecimalDivisionByZeroError);
  });

  it('Given two decimals, When remainder is calculated, Then returns the JavaScript `%` equivalent', () => {
    expect(adapter.remainder('7' as never, '3' as never)).toBe('1');
  });

  it('Given a zero remainder divisor, When calculated, Then throws a typed division error', () => {
    expect(() => adapter.remainder('7' as never, '0' as never)).toThrow(
      DecimalDivisionByZeroError,
    );
  });

  it('Given an integer exponent, When power is calculated, Then returns the JavaScript `**` equivalent', () => {
    expect(adapter.power('2' as never, '3' as never)).toBe('8');
  });

  it('Given a negative integer exponent and a context, When power is calculated, Then applies explicit rounding', () => {
    expect(
      adapter.power(
        '3' as never,
        '-1' as never,
        createDecimalContext(2, 'half-up'),
      ),
    ).toBe('0.33');
  });

  it('Given a negative base and an even negative exponent, When rounded up or down, Then uses the positive result sign', () => {
    expect(
      adapter.power(
        '-3' as never,
        '-2' as never,
        createDecimalContext(2, 'ceil'),
      ),
    ).toBe('0.12');
    expect(
      adapter.power(
        '-3' as never,
        '-2' as never,
        createDecimalContext(2, 'floor'),
      ),
    ).toBe('0.11');
  });

  it('Given a negative base and an odd negative exponent, When rounded up or down, Then uses the negative result sign', () => {
    expect(
      adapter.power(
        '-3' as never,
        '-3' as never,
        createDecimalContext(2, 'ceil'),
      ),
    ).toBe('-0.03');
    expect(
      adapter.power(
        '-3' as never,
        '-3' as never,
        createDecimalContext(2, 'floor'),
      ),
    ).toBe('-0.04');
  });

  it('Given a negative integer exponent without a context, When power is calculated, Then rejects implicit precision', () => {
    expect(() => adapter.power('3' as never, '-1' as never)).toThrow(
      DecimalAdapterError,
    );
  });

  it('Given zero and a negative exponent, When power is calculated, Then throws a typed division error', () => {
    expect(() =>
      adapter.power(
        '0' as never,
        '-1' as never,
        createDecimalContext(2, 'half-up'),
      ),
    ).toThrow(DecimalDivisionByZeroError);
  });

  it('Given a non-integer exponent, When power is calculated, Then maps it to an adapter error', () => {
    expect(() => adapter.power('2' as never, '0.5' as never)).toThrow(
      DecimalAdapterError,
    );
  });

  it('Given a decimal, When negated, Then returns its additive inverse', () => {
    expect(adapter.negate('-2.5' as never)).toBe('2.5');
  });

  it('Given an invalid canonical input at the adapter boundary, When added, Then throws the shared input error', () => {
    expect(() => adapter.add('not-a-decimal' as never, '1' as never)).toThrow(
      InvalidDecimalError,
    );
  });

  it('Given an unsupported adapter context, When divided, Then maps the provider failure', () => {
    expect(() =>
      adapter.divide('1' as never, '3' as never, {
        decimalPlaces: Number.MAX_SAFE_INTEGER,
        rounding: 'down',
      }),
    ).toThrow(DecimalAdapterError);
  });

  it('Given a forged context with an unsupported rounding mode, When divided, Then throws the shared context error', () => {
    expect(() =>
      adapter.divide(
        '1' as never,
        '3' as never,
        { decimalPlaces: 2, rounding: 'nearest' } as never,
      ),
    ).toThrow(DecimalContextError);
  });

  it('Given an arithmetic result outside the Decimal range, When multiplied, Then throws a range error', () => {
    expect(() =>
      adapter.multiply('1e1000' as never, '1e1000' as never),
    ).toThrow(DecimalRangeError);
  });

  it.each([
    ['1', '2', -1],
    ['2', '2', 0],
    ['3', '2', 1],
  ] as const)(
    'Given %s and %s, When compared, Then returns %s',
    (left, right, expected) => {
      expect(adapter.compare(left as never, right as never)).toBe(expected);
    },
  );

  it('Given an invalid right operand, When compared, Then preserves the shared input error', () => {
    expect(() => adapter.compare('1' as never, 'not-a-decimal' as never)).toThrow(
      InvalidDecimalError,
    );
  });
});
