import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';

import rule from './no-consecutive-same-return-guards.mjs';

describe('no-consecutive-same-return-guards', () => {
  const ruleTester = new RuleTester({
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
  });

  it('describes valid and invalid repeated-return guard patterns', () => {
    ruleTester.run('no-consecutive-same-return-guards', rule, {
      valid: [
        'function check(value) { if (isMissing(value)) return false; return true; }',
        'function check(value) { if (isMissing(value)) return false; if (isInvalid(value)) return true; }',
        'function check(value) { if (isMissing(value)) return false; doWork(); if (isInvalid(value)) return false; }',
        'function check(value) { if (isMissing(value)) return false; else return true; }',
        'function check(value) { if (isMissing(value)) return false; if (isInvalid(value)) throw false; }',
      ],
      invalid: [
        {
          code: 'function check(value) { if (isMissing(value)) return false; if (isInvalid(value)) return false; return true; }',
          errors: [{ messageId: 'sameReturnGuards' }],
        },
        {
          code: 'function check(value) { if (isInternal(code)) return true; if (isUnavailable(code)) return true; if (isNetwork(code)) return true; }',
          errors: [{ messageId: 'sameReturnGuards' }],
        },
        {
          code: 'function check(value) { if (isInvalidDate(value)) { throw new RangeError(`Invalid instant: ${value}`); } if (isInvalidHour(value)) throw new RangeError(`Invalid instant: ${value}`); if (isInvalidMinute(value)) throw new RangeError(`Invalid instant: ${value}`); }',
          errors: [{ messageId: 'sameReturnGuards' }],
        },
      ],
    });
  });
});
