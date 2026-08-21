import { DecimalContextError } from '../errors';
import { createDecimalContext } from './decimal-context';

describe('createDecimalContext', () => {
  it('Given valid decimal places and rounding, When created, Then returns the context', () => {
    const context = createDecimalContext(4, 'half-even');

    expect(context).toEqual({
      decimalPlaces: 4,
      rounding: 'half-even',
    });
    expect(Object.isFrozen(context)).toBe(true);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, undefined])(
    'Given invalid decimal places %s, When created, Then throws a context error',
    (decimalPlaces) => {
      expect(() =>
        createDecimalContext(decimalPlaces as never, 'down'),
      ).toThrow(DecimalContextError);
    },
  );

  it('Given an unsupported rounding mode, When created, Then throws a context error', () => {
    expect(() => createDecimalContext(2, 'nearest' as never)).toThrow(
      DecimalContextError,
    );
  });
});
