/**
 * Creates the workspace-standard Vitest reporters and coverage formats.
 *
 * Keeping this configuration in one place prevents individual project
 * configurations from silently producing different CI artifacts.
 *
 * @param projectName - Stable Nx project name used in report file paths.
 * @param workspacePathPrefix - Relative path from the project root to the workspace root.
 * @returns Reporter and coverage configuration to spread into a Vitest test config.
 */
export function createVitestReporting(
  projectName: string,
  workspacePathPrefix: string,
) {
  const reportDirectory = `${workspacePathPrefix}reports/test/${projectName}`;

  return {
    reporters: ['default', 'junit', 'json'],
    outputFile: {
      junit: `${reportDirectory}/junit.xml`,
      json: `${reportDirectory}/results.json`,
    },
    coverage: {
      reporter: ['text', 'html', 'lcov', 'json-summary'],
    },
  };
}
