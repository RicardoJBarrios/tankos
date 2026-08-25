import nx from '@nx/eslint-plugin';

const recommendedTypeScriptRules = {
  '@angular-eslint/prefer-inject': 'error',
  '@angular-eslint/prefer-standalone': 'error',
  '@angular-eslint/no-input-rename': 'error',
  '@angular-eslint/no-output-rename': 'error',
  '@angular-eslint/no-output-native': 'error',
  '@angular-eslint/no-output-on-prefix': 'error',
  '@angular-eslint/prefer-output-emitter-ref': 'error',
  '@angular-eslint/prefer-output-readonly': 'error',
  '@angular-eslint/no-duplicates-in-metadata-arrays': 'error',
  '@angular-eslint/no-uncalled-signals': 'error',
  '@angular-eslint/contextual-lifecycle': 'error',
  '@angular-eslint/use-lifecycle-interface': 'error',
  '@angular-eslint/no-async-lifecycle-method': 'error',
  '@angular-eslint/no-lifecycle-call': 'error',
  '@angular-eslint/no-empty-lifecycle-method': 'error',
};

const recommendedTemplateRules = {
  '@angular-eslint/template/alt-text': 'error',
  '@angular-eslint/template/button-has-type': 'error',
  '@angular-eslint/template/click-events-have-key-events': 'error',
  '@angular-eslint/template/interactive-supports-focus': 'error',
  '@angular-eslint/template/label-has-associated-control': 'error',
  '@angular-eslint/template/valid-aria': 'error',
  '@angular-eslint/template/role-has-required-aria': 'error',
  '@angular-eslint/template/no-autofocus': 'error',
  '@angular-eslint/template/no-positive-tabindex': 'error',
  '@angular-eslint/template/no-duplicate-attributes': 'error',
  '@angular-eslint/template/prefer-control-flow': 'error',
  '@angular-eslint/template/prefer-at-else': 'error',
  '@angular-eslint/template/prefer-at-empty': 'error',
  '@angular-eslint/template/prefer-contextual-for-variables': 'error',
  '@angular-eslint/template/use-track-by-function': 'error',
  '@angular-eslint/template/prefer-self-closing-tags': 'error',
  '@angular-eslint/template/no-inline-styles': 'error',
  '@angular-eslint/template/no-interpolation-in-attributes': 'error',
};

const strictTypeScriptRules = {
  ...recommendedTypeScriptRules,
  '@angular-eslint/prefer-on-push-component-change-detection': 'error',
  '@angular-eslint/component-max-inline-declarations': [
    'error',
    { template: 20, styles: 20, animations: 20 },
  ],
};

/**
 * Creates the reusable Angular ESLint profile for a TankOS workspace project.
 *
 * The profile deliberately does not enable `template/no-call-expression` or
 * `no-pipe-impure`: signals are functions in templates and TankOS time pipes
 * intentionally react to locale changes. Type-aware parsing is supplied by
 * the shared TypeScript profile and is required by the uncalled-signals rule.
 */
export function createAngularEslintConfig({
  prefix = 'tankos',
  profile = 'recommended',
} = {}) {
  const typeScriptRules =
    profile === 'strict' ? strictTypeScriptRules : recommendedTypeScriptRules;

  return [
    ...nx.configs['flat/angular'],
    ...nx.configs['flat/angular-template'],
    {
      files: ['**/*.ts'],
      rules: {
        ...typeScriptRules,
        '@angular-eslint/directive-selector': [
          'error',
          { type: 'attribute', prefix, style: 'camelCase' },
        ],
        '@angular-eslint/component-selector': [
          'error',
          { type: 'element', prefix, style: 'kebab-case' },
        ],
      },
    },
    {
      files: ['**/*.html'],
      rules: recommendedTemplateRules,
    },
  ];
}
