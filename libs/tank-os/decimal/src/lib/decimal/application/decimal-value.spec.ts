import { createBigJsDecimalAdapter } from '../adapters/big-js';
import { createDecimalContext, type Decimal } from '../core';
import { createDecimal } from './decimal-value';

describe('Decimal fluent value object', () => {
  const arithmetic = createBigJsDecimalAdapter();
  const decimal = (value: string): Decimal => createDecimal(value, arithmetic);

  it('Given a decimal, When read, Then exposes its canonical value without mutating it', () => {
    const value = decimal('001.20');

    expect(value.value).toBe('1.2');
    expect(value.toString()).toBe('1.2');
    expect(JSON.stringify(value)).toBe('"1.2"');
  });

  it('Given a Decimal, When JavaScript requests implicit numeric coercion, Then throws and requires fluent methods', () => {
    const value = decimal('2');

    expect(() => (value as unknown as number) * 3).toThrow(TypeError);
    expect(() => (value as unknown as string) + value).toThrow(TypeError);
    expect(String(value)).toBe('2');
  });

  it('Given several operands, When operations are chained, Then returns a new Decimal at each step', () => {
    const original = decimal('10');
    const value = original.add('2', '3').multiply('2').subtract('4');

    expect(value).toMatchObject({ value: '26' });
    expect(value.value).toBe('26');
    expect(original.value).toBe('10');
    expect(value).not.toBe(original);
  });

  it('Given another Decimal, When used as an operand, Then preserves the configured adapter', () => {
    expect(decimal('1.5').add(decimal('2.5')).value).toBe('4');
  });

  it('Given a division context, When division is chained, Then applies it to every divisor', () => {
    expect(
      decimal('1').divide('3', createDecimalContext(4, 'half-up'), '2').value,
    ).toBe('0.1667');
  });

  it('Given arithmetic operations, When remainder, power and negation are chained, Then returns the expected Decimal values', () => {
    expect(decimal('7').remainder('3').add('2').power('2').negate().value).toBe(
      '-9',
    );
  });

  it.each([
    ['1', '2', -1],
    ['2', '2', 0],
    ['3', '2', 1],
  ] as const)(
    'Given %s and %s, When compared, Then returns %s',
    (left, right, expected) => {
      expect(decimal(left).compare(right)).toBe(expected);
    },
  );
});
