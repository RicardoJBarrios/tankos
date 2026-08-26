import { createVitestConfig } from '../../tools/testing/vitest-config';

export default createVitestConfig({
  projectName: 'authz-firestore',
  root: __dirname,
  angular: false,
  staticCopy: false,
  aliases: {
    '@tankos/authz': '../authz/src/index.ts',
    '@tankos/data-access': '../data-access/src/index.ts',
  },
});
