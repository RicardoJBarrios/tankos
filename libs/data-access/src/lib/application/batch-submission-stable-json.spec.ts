import { describe, expect, it } from 'vitest';
import { stableJson } from './batch-submission-stable-json';

describe('stableJson', () => {
  it('Given nested objects, When serializing them, Then object order does not affect the output', () => {
    expect(stableJson({ b: 2, a: { d: 4, c: 3 } })).toBe(
      stableJson({ a: { c: 3, d: 4 }, b: 2 }),
    );
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['string', 'value'],
    ['number', 42],
    ['boolean', true],
    ['array', [1, 'two']],
  ])('Given a %s, When serializing it, Then it produces stable JSON', (_kind, value) => {
    expect(() => stableJson(value)).not.toThrow();
  });

  it('Given an unserializable circular value, When serializing it, Then it raises a validation error', () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;
    expect(() => stableJson(circular)).toThrow('cannot be serialized');
  });
});
