// @flow
import fs from 'fs';
import path from 'path';

import { executeChildProcess } from 'monopack-process';
import type { ExitOrSignal } from 'monopack-process';
import { aMonorepo, aPackage } from 'monopack-repo-builder';

import { main } from '../main';

jest.setTimeout(60000);

describe('monopack build', () => {
  describe('validation', () => {
    it('should reject building a non-existing file', async () => {
      await aMonorepo()
        .named('root')
        .withEmptyConfigFile()
        .execute(async ({ root }) => {
          // when
          let error = null;
          try {
            await build(root, 'main.js');
          } catch (e) {
            error = e;
          }

          // then
          expect(error).not.toBeNull();
          if (error) {
            expect(error.message).toContain('Compilation failed');
            expect(error.message).toContain('entry file was not found');
          }
        });
    });
  });

  describe('command', () => {
    it('should build a js file at the top of the monorepo', async () => {
      // given
      await aMonorepo()
        .named('root')
        .withEmptyConfigFile()
        .withSource('main.js', `console.log('ok');`)
        .execute(async ({ root }) => {
          // when
          const {
            compilationOutput,
            result,
            stdout,
            stderr,
          } = await buildAndRun(root, 'main.js');

          // then
          expect(compilationOutput).toContain(
            'monopack successfully packaged your app'
          );
          expect(result).toEqual({ type: 'EXIT', exitCode: 0 });
          expect(stdout).toBe('ok\n');
          expect(stderr).toBe('');
        });
    });

    it('js files should be build with source maps', async () => {
      // given
      await aMonorepo()
        .named('root')
        .withEmptyConfigFile()
        .withSource(
          'main.js',
          `
            function action1() {
              action2();
            }
            function action2() {
              action3();
            }
            function action3() {
              throw new Error('Failed from action 3');
            }
            action1();
          `
        )
        .execute(async ({ root }) => {
          // when
          const {
            compilationOutput,
            result,
            stdout,
            stderr,
          } = await buildAndRun(root, 'main.js');

          // then
          expect(compilationOutput).toContain(
            'monopack successfully packaged your app'
          );
          expect(stdout).toBe('');
          expect(result).toEqual({ type: 'EXIT', exitCode: 1 });
          expect(stderr).toContain('main.js:9:21');
        });
    });

    it('should build a js file written with stage-2 features at the top of the monorepo', async () => {
      // given
      await aMonorepo()
        .named('root')
        .withEmptyConfigFile()
        .withSource(
          'main.js',
          `
            function logBudget() {
              const budget = 1_000_000_000_000;
              console.log(budget);
            }
            logBudget();
        `
        )
        .execute(async ({ root }) => {
          // when
          const {
            compilationOutput,
            result,
            stdout,
            stderr,
          } = await buildAndRun(root, 'main.js');

          // then
          expect(compilationOutput).toContain(
            'monopack successfully packaged your app'
          );
          expect(result).toEqual({ type: 'EXIT', exitCode: 0 });
          expect(stdout).toBe('1000000000000\n');
          expect(stderr).toBe('');
        });
    });

    it('should build a js file written using custom babel config enabling do-expressions at the top of the monorepo', async () => {
      // given
      await aMonorepo()
        .named('root')
        .withConfigFile(
          `module.exports = {
            babelConfigModifier: () => ({
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      node: '8.11.3',
                    },
                    modules: false,
                  },
                ],
                '@babel/preset-flow',
              ],
              "plugins": [require.resolve("@babel/plugin-proposal-do-expressions")]
            }),
          };`
        )
        .withDevDependencies({
          '@babel/core': '^7.0.0',
          'babel-loader': '^8.0.0',
          '@babel/preset-env': '^7.0.0',
          '@babel/preset-flow': '^7.0.0',
          '@babel/plugin-proposal-do-expressions': '^7.0.0',
        })
        .withSource(
          'main.js',
          `
            const x = 11;
            const a = do {
              if (x > 10) {
                'big';
              } else {
                'small';
              }
            };
            console.log(a);
        `
        )
        .execute(async ({ root }) => {
          // when
          const {
            compilationOutput,
            result,
            stdout,
            stderr,
          } = await buildAndRun(root, 'main.js');

          // then
          expect(compilationOutput).toContain(
            'monopack successfully packaged your app'
          );
          expect(result).toEqual({ type: 'EXIT', exitCode: 0 });
          expect(stdout).toBe('big\n');
          expect(stderr).toBe('');
        });
    });

    it('should build a js file using another package of a yarn workspaces monorepo', async () => {
      // given
      await aMonorepo()
        .named('root')
        .withEmptyConfigFile()
        .withWorkspacesEnabled()
        .withPackages(
          aPackage()
            .named('test-mp-main')
            .withDependencies({
              'test-mp-lib': '1.0.0',
            })
            .withSource(
              'main.js',
              `
                import {lib} from 'test-mp-lib/lib';
                lib();
              `
            ),
          aPackage()
            .named('test-mp-lib')
            .withSource(
              'lib.js',
              `
                  export function lib() {
                    console.log('ok');
                  }
                `
            )
        )
        .execute(async ({ root }) => {
          // when
          const {
            compilationOutput,
            result,
            stdout,
            stderr,
          } = await buildAndRun(root, './packages/test-mp-main/main.js');

          // then
          expect(compilationOutput).toContain(
            'monopack successfully packaged your app'
          );
          expect(stderr).toBe('');
          expect(result).toEqual({ type: 'EXIT', exitCode: 0 });
          expect(stdout).toBe('ok\n');
        });
    });

    it('should build a js file using another package of a lerna monorepo', async () => {
      // given
      await aMonorepo()
        .named('root')
        .withEmptyConfigFile()
        .withLernaJsonFile()
        .withPackages(
          aPackage()
            .named('test-mp-main')
            .withDependencies({
              'test-mp-lib': '1.0.0',
            })
            .withSource(
              'main.js',
              `
                import {lib} from 'test-mp-lib/lib';
                lib();
              `
            ),
          aPackage()
            .named('test-mp-lib')
            .withSource(
              'lib.js',
              `
                  export function lib() {
                    console.log('ok');
                  }
                `
            )
        )
        .execute(async ({ root }) => {
          // when
          const {
            compilationOutput,
            result,
            stdout,
            stderr,
          } = await buildAndRun(root, './packages/test-mp-main/main.js');

          // then
          expect(compilationOutput).toContain(
            'monopack successfully packaged your app'
          );
          expect(stderr).toBe('');
          expect(result).toEqual({ type: 'EXIT', exitCode: 0 });
          expect(stdout).toBe('ok\n');
        });
    });

    it('should build a js file using a nodejs module', async () => {
      // given
      await aMonorepo()
        .named('root')
        .withEmptyConfigFile()
        .withSource(
          'main.js',
          `
            import fs from 'fs';
            console.log(fs.existsSync(__filename));
          `
        )
        .execute(async ({ root }) => {
          // when
          const { result, stdout, stderr } = await buildAndRun(root, 'main.js');

          // then
          expect(stderr).toBe('');
          expect(stdout).toBe('false\n');
          expect(result).toEqual({ type: 'EXIT', exitCode: 0 });
        });
    });

    it('should build a js file using a third-party package', async () => {
      // given
      await aMonorepo()
        .named('root')
        .withEmptyConfigFile()
        .withDependencies({ lodash: '4.17.5' })
        .withSource(
          'main.js',
          `
            import _ from 'lodash';
            console.log(_.VERSION);
          `
        )
        .execute(async ({ root }) => {
          // when
          const { buildDirectory } = await build(root, 'main.js', null);
          const { result, stdout, stderr } = await executeChildProcess(
            'node',
            [path.join(buildDirectory, 'main.js')],
            { cwd: root }
          );

          // then
          expect(stderr).toBe('');
          expect(stdout).toBe('4.17.5\n');
          expect(result).toEqual({ type: 'EXIT', exitCode: 0 });
        });
    });

    it('should build a js file using a dynamically imported third-party package', async () => {
      // given
      await aMonorepo()
        .named('root')
        .withEmptyConfigFile()
        .withDependencies({ lodash: '4.17.5' })
        .withSource(
          'main.js',
          `
            console.log('ok');
          `
        )
        .execute(async ({ root }) => {
          // when
          const { buildDirectory } = await build(root, 'main.js', null, [
            'lodash',
          ]);

          // then
          const packageJson = JSON.parse(
            fs.readFileSync(path.join(buildDirectory, 'package.json'), 'utf8')
          );
          expect(packageJson.dependencies.lodash).toBe('4.17.5');
        });
    });

    // eslint-disable-next-line jest/no-disabled-tests
    xit('should build a js file to a temp directory', async () => {});

    // eslint-disable-next-line jest/no-disabled-tests
    xit('should build a js file, watch for file changes and rebuild on file changes', async () => {});
  });
});

async function buildAndRun(
  root: string,
  mainJs: string
): Promise<{
  compilationOutput: string,
  result: ExitOrSignal,
  stdout: string,
  stderr: string,
}> {
  const { compilationOutput } = await build(root, mainJs);
  const { result, stdout, stderr } = await executeChildProcess(
    'node',
    ['./build/main.js'],
    { cwd: root }
  );
  return { compilationOutput, result, stdout, stderr };
}

async function build(
  root: string,
  mainJs: string,
  outputDirectory: string | null = './build',
  extraModules: $ReadOnlyArray<string> = []
): Promise<{
  compilationOutput: string,
  buildDirectory: string,
}> {
  let compilationOutput = '';
  const result = await main({
    watch: false,
    print: content => {
      compilationOutput = compilationOutput + content;
    },
    outputDirectory,
    mainJs,
    currentWorkingDirectory: root,
    command: 'build',
    installPackages: null,
    extraModules,
  });
  if (result.success) {
    const buildDirectory = result.outputDirectory;
    return { compilationOutput, buildDirectory };
  } else {
    throw new Error(
      `Compilation failed : '${compilationOutput}' exitCode: ${result.exitCode}`
    );
  }
}
