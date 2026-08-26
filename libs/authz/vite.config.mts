import { createVitestConfig } from '../../tools/testing/vitest-config';

export default createVitestConfig({
  projectName: 'authz',
  root: __dirname,
  angular: false,
  staticCopy: false,
  aliases: {
    '@tankos/data-access': '../data-access/src/index.ts',
  },
});
