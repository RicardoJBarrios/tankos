/// <reference types='vitest' />
import { defineConfig, type PluginOption } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'node:path';
import { createVitestReporting } from './vitest-reporting';

const TEST_INCLUDE = [
  '{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
];
const COVERAGE_THRESHOLDS = {
  lines: 100,
  statements: 100,
  functions: 100,
  branches: 100,
};

export interface VitestConfigOptions {
  readonly projectName: string;
  readonly root: string;
  readonly workspacePathPrefix?: string;
  readonly angular?: boolean;
  readonly staticCopy?: boolean;
  readonly aliases?: Readonly<Record<string, string>>;
  readonly dedupe?: readonly string[];
  readonly setupFiles?: string | false;
  readonly inlineAngularDependencies?: boolean;
}

/** Creates the workspace-standard browser Vitest/Vite configuration. */
export function createVitestConfig(options: VitestConfigOptions) {
  const workspacePathPrefix = options.workspacePathPrefix ?? '../../';
  const reporting = createVitestReporting(
    options.projectName,
    workspacePathPrefix,
  );
  const plugins: PluginOption[] = [];
  if (options.angular !== false) plugins.push(angular());
  if (options.staticCopy !== false)
    plugins.push(viteStaticCopy({ targets: [{ src: '*.md', dest: '.' }] }));

  const resolveOptions = {
    tsconfigPaths: true,
    ...(options.dedupe ? { dedupe: [...options.dedupe] } : {}),
    ...(options.aliases
      ? {
          alias: Object.fromEntries(
            Object.entries(options.aliases).map(([name, path]) => [
              name,
              resolve(options.root, path),
            ]),
          ),
        }
      : {}),
  };

  return defineConfig(() => ({
    root: options.root,
    cacheDir: `${workspacePathPrefix}node_modules/.vite/${options.projectName}`,
    resolve: resolveOptions,
    plugins,
    test: {
      name: options.projectName,
      watch: false,
      globals: true,
      environment: 'jsdom',
      include: TEST_INCLUDE,
      ...(options.setupFiles === false
        ? {}
        : { setupFiles: [options.setupFiles ?? 'src/test-setup.ts'] }),
      reporters: ['default'],
      ...reporting,
      ...(options.inlineAngularDependencies
        ? {
            server: {
              deps: {
                inline: [
                  '@angular/core',
                  '@angular/common',
                  '@angular/compiler',
                  '@angular/forms',
                  '@angular/platform-browser',
                  '@angular/platform-browser-dynamic',
                  '@ngneat/spectator',
                ],
              },
            },
          }
        : {}),
      coverage: {
        ...reporting.coverage,
        reportsDirectory: `${workspacePathPrefix}coverage/${
          options.projectName.includes('/')
            ? options.projectName
            : options.root.includes('/apps/')
              ? `apps/${options.projectName}`
              : `libs/${options.projectName}`
        }`,
        provider: 'v8' as const,
        thresholds: COVERAGE_THRESHOLDS,
      },
    },
  }));
}
