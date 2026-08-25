import { createVitestConfig } from '../../tools/testing/vitest-config';

export default createVitestConfig({
  projectName: 'units-json-http',
  root: __dirname,
  angular: false,
});
