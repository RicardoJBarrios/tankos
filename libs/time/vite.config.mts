import { createVitestConfig } from '../../tools/testing/vitest-config';

export default createVitestConfig({
  projectName: 'time',
  root: __dirname,
  aliases: {
    '@tankos/formatting': '../formatting/src/index.ts',
    '@tankos/time': 'src/index.ts',
  },
});
