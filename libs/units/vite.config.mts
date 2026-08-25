import { createVitestConfig } from '../../tools/testing/vitest-config';

export default createVitestConfig({
  projectName: 'units',
  root: __dirname,
  aliases: {
    '@tankos/formatting': '../formatting/src/index.ts',
    '@tankos/decimal-big-js': '../decimal-big-js/src/index.ts',
    '@tankos/decimal': '../decimal/src/index.ts',
    '@tankos/data-access': '../data-access/src/index.ts',
  },
});
