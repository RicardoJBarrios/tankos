import { describe, expect, it } from 'vitest';
import { validateLifecycleSelection } from './lifecycle';

describe('validateLifecycleSelection', () => {
  it('Given no lifecycle filter, When validating it, Then it preserves undefined', () => {
    expect(validateLifecycleSelection(undefined)).toBeUndefined();
  });

  it('Given unique lifecycle statuses, When validating them, Then it preserves the selection', () => {
    const selection = ['active', 'marked-for-deletion'] as const;
    expect(validateLifecycleSelection(selection)).toBe(selection);
  });

  it.each([[[]], [['active', 'active']]])(
    'Given an empty or duplicated selection %s, When validating it, Then it rejects it',
    (selection) => {
      expect(() => validateLifecycleSelection(selection as never)).toThrow(
        TypeError,
      );
    },
  );

  it('Given an unknown status, When validating it, Then it rejects it', () => {
    expect(() => validateLifecycleSelection(['unknown'] as never)).toThrow(
      TypeError,
    );
  });
});
