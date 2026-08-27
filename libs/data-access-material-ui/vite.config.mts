import { createVitestConfig } from '../../tools/testing/vitest-config';

export default createVitestConfig({
  projectName: 'data-access-material-ui',
  root: __dirname,
  aliases: {
    '@tankos/data-access': '../data-access/src/index.ts',
    '@tankos/data-access-ui': '../data-access-ui/src/index.ts',
  },
  dedupe: ['@angular/common', '@angular/compiler', '@angular/core'],
  inlineAngularDependencies: true,
});
