import { createVitestConfig } from '../../tools/testing/vitest-config';

export default createVitestConfig({
  projectName: 'units-composition',
  root: __dirname,
  aliases: { '@tankos/units': '../units/src/index.ts' },
  dedupe: ['@angular/common', '@angular/compiler', '@angular/core'],
  inlineAngularDependencies: true,
});
