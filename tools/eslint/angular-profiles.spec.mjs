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
    expect(rules['regexp/no-super-linear-backtracking']).toBe('error');
    expect(rules['tsdoc/syntax']).toBe('error');
    expect(rules['@angular-eslint/prefer-inject']).toBe('error');
    expect(rules['tankos/no-multiple-comparisons-in-condition']).toEqual([
      'error',
      { maxConditionTerms: 2 },
    ]);
  });

  it('uses the configured selector prefix', () => {
    const rules = flattenRules(
      createAngularEslintConfig({ prefix: 'custom' }),
    );

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
