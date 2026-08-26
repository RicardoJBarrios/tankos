import { createVitestConfig } from '../../tools/testing/vitest-config';

export default createVitestConfig({
  projectName: 'authn',
  root: __dirname,
  aliases: {
    '@tankos/data-access': '../data-access/src/index.ts',
  },
});
