import { createVitestConfig } from '../../tools/testing/vitest-config';

export default createVitestConfig({
  projectName: 'observability-ui',
  root: __dirname,
  aliases: {
    '@tankos/observability': '../observability/src/index.ts',
  },
  dedupe: ['@angular/common', '@angular/compiler', '@angular/core'],
  inlineAngularDependencies: true,
});
