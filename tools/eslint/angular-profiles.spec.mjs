import { describe, expect, it } from 'vitest';

import { createAngularEslintConfig } from './angular-profiles.mjs';

function flattenRules(config) {
  return Object.assign({}, ...config.map((item) => item.rules ?? {}));
}

describe('createAngularEslintConfig', () => {
  it('composes the shared quality profiles with the Angular profiles', () => {
    const config = createAngularEslintConfig();
    const rules = flattenRules(config);

    expect(rules['@nx/enforce-module-boundaries']).toBeDefined();
    expect(rules['@typescript-eslint/no-floating-promises']).toBeDefined();
    expect(rules.eqeqeq).toEqual(['error', 'always']);
    expect(rules['no-console']).toBe('error');
    expect(rules['no-eval']).toBe('error');
    expect(rules['no-implicit-coercion']).toBe('error');
    expect(rules['no-new-func']).toBe('error');
    expect(rules['@typescript-eslint/no-magic-numbers']).toEqual([
      'error',
      {
        ignore: [
          -1, 0, 1, 2, 3, 4, 6, 8, 9, 11, 12, 23, 24, 28, 29, 30, 31, 32, 48,
          59, 60, 100, 365, 400, 500, 1_000, 10_000, 60_000, 900_000, 1_000_000,
        ],
        ignoreArrayIndexes: true,
        ignoreEnums: true,
        ignoreNumericLiteralTypes: true,
        ignoreReadonlyClassProperties: true,
      },
    ]);
    expect(rules['regexp/no-super-linear-backtracking']).toBe('error');
    expect(rules['tsdoc/syntax']).toBe('error');
    expect(rules['@angular-eslint/prefer-inject']).toBe('error');
    expect(rules['tankos/no-multiple-comparisons-in-condition']).toEqual([
      'error',
      { maxConditionTerms: 2 },
    ]);
  });

  it('uses the configured selector prefix', () => {
    const rules = flattenRules(createAngularEslintConfig({ prefix: 'custom' }));

    expect(rules['@angular-eslint/component-selector']).toEqual([
      'error',
      { type: 'element', prefix: 'custom', style: 'kebab-case' },
    ]);
    expect(rules['@angular-eslint/directive-selector']).toEqual([
      'error',
      { type: 'attribute', prefix: 'custom', style: 'camelCase' },
    ]);
  });

  it('uses the strict profile by default and allows opting into recommended', () => {
    const defaultRules = flattenRules(createAngularEslintConfig());
    const recommendedRules = flattenRules(
      createAngularEslintConfig({ profile: 'recommended' }),
    );
    const strictRules = flattenRules(
      createAngularEslintConfig({ profile: 'strict' }),
    );

    expect(
      defaultRules['@angular-eslint/component-max-inline-declarations'],
    ).toEqual(['error', { template: 20, styles: 20, animations: 20 }]);
    expect(
      recommendedRules['@angular-eslint/component-max-inline-declarations'],
    ).toBeUndefined();
    expect(
      strictRules['@angular-eslint/component-max-inline-declarations'],
    ).toEqual(['error', { template: 20, styles: 20, animations: 20 }]);
  });
});
