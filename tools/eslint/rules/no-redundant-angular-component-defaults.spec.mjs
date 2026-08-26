import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, it } from 'vitest';

import rule from './no-redundant-angular-component-defaults.mjs';

describe('no-redundant-angular-component-defaults', () => {
  it('allows omitted defaults and intentional non-default metadata', () => {
    const ruleTester = new RuleTester({
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      },
    });

    ruleTester.run('no-redundant-angular-component-defaults', rule, {
      valid: [
        '@Component({ selector: "x", template: "" }) class Example {}',
        '@Component({ selector: "x", template: "", changeDetection: ChangeDetectionStrategy.Default }) class Example {}',
        '@Component({ selector: "x", template: "", standalone: false }) class Example {}',
      ],
      invalid: [],
    });
  });

  it('rejects explicit Angular 22 defaults', () => {
    const ruleTester = new RuleTester({
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      },
    });

    ruleTester.run('no-redundant-angular-component-defaults', rule, {
      valid: [],
      invalid: [
        {
          code: '@Component({ standalone: true }) class Example {}',
          errors: [{ messageId: 'standalone' }],
          output: '@Component({}) class Example {}',
        },
        {
          code: '@Component({ changeDetection: ChangeDetectionStrategy.OnPush }) class Example {}',
          errors: [{ messageId: 'changeDetection' }],
          output: '@Component({}) class Example {}',
        },
        {
          code: '@Component({ standalone: true, changeDetection: ChangeDetectionStrategy.OnPush }) class Example {}',
          errors: [
            { messageId: 'standalone' },
            { messageId: 'changeDetection' },
          ],
          output: '@Component({}) class Example {}',
        },
        {
          code: '@Component({ selector: "x", standalone: true, template: "" }) class Example {}',
          errors: [{ messageId: 'standalone' }],
          output:
            '@Component({ selector: "x", template: "" }) class Example {}',
        },
      ],
    });
  });
});
