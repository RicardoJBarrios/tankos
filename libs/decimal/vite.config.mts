import { createVitestConfig } from '../../tools/testing/vitest-config';

export default createVitestConfig({
  projectName: 'decimal',
  root: __dirname,
  aliases: {
    '@tankos/formatting': '../formatting/src/index.ts',
    '@tankos/decimal': 'src/index.ts',
    '@tankos/decimal-big-js': '../decimal-big-js/src/index.ts',
  },
});
