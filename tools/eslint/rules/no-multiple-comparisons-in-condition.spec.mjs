import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';

import rule from './no-multiple-comparisons-in-condition.mjs';

describe('no-multiple-comparisons-in-condition', () => {
  it('accepts conditions with up to two terms', () => {
    const ruleTester = new RuleTester({
      languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
    });

    ruleTester.run('no-multiple-comparisons-in-condition', rule, {
      valid: [
        'if (isReady) report();',
        'if (isReady && isVisible) report();',
        'if (value >= minimum) report();',
        'if (value >= minimum && value <= maximum) report();',
        'if (isOdd(value) && isNumber(value)) report();',
        'const result = value >= minimum ? valid : invalid;',
      ],
      invalid: [],
    });
  });

  it('rejects multiple comparisons in if, loop and ternary conditions', () => {
    const ruleTester = new RuleTester({
      languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
    });

    ruleTester.run('no-multiple-comparisons-in-condition', rule, {
      valid: [],
      invalid: [
        {
          code: 'if (isOdd(value) && isNumber(value) && value > 0) report();',
          errors: [{ messageId: 'multipleComparisons' }],
        },
        {
          code: 'while (value === first || value === second || value === third) advance();',
          errors: [{ messageId: 'multipleComparisons' }],
        },
        {
          code: 'for (; value > minimum && value < maximum && value !== excluded; advance()) report();',
          errors: [{ messageId: 'multipleComparisons' }],
        },
        {
          code: 'const result = value === first && value === second && value !== third ? one : fallback;',
          errors: [{ messageId: 'multipleComparisons' }],
        },
      ],
    });
  });
});
