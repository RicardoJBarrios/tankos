import baseConfig from '../../eslint.config.mjs';
import { createVitestEslintConfig } from '../../tools/eslint/vitest-profiles.mjs';

export default [...baseConfig, ...createVitestEslintConfig()];
