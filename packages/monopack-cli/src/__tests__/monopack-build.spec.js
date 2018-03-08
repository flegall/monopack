// @flow
import { expect } from 'chai';
import { executeChildProcess } from 'monopack-process';
import type { ExitOrSignal } from 'monopack-process';
import { aMonorepo, aPackage } from 'monopack-repo-builder';

import { main } from '../main';

// $FlowIgnore
jest.setTimeout(30000);

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
          expect(error).not.to.be.null;
          if (error) {
            expect(error.message).to.have.string('Compilation failed');
            expect(error.message).to.have.string('entry file was not found');
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
          expect(compilationOutput).to.include(
            'monopack successfully packaged your app'
          );
          expect(result).to.deep.equal({ type: 'EXIT', exitCode: 0 });
          expect(stdout).to.equal('ok\n');
          expect(stderr).to.equal('');
        });
    });

    it('should build a js file written with es features at the top of the monorepo', async () => {
      // given
      await aMonorepo()
        .named('root')
        .withEmptyConfigFile()
        .withSource(
          'main.js',
          `
            async function ok() {
              return 'ok';
            }
            async function run() {
              return await ok();
            }
            run()
              .then(result => console.log(result))
              .catch(error => console.log(error));
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
          expect(compilationOutput).to.include(
            'monopack successfully packaged your app'
          );
          expect(result).to.deep.equal({ type: 'EXIT', exitCode: 0 });
          expect(stdout).to.equal('ok\n');
          expect(stderr).to.equal('');
        });
    });

    it('should build a js file written using custom babel config at the top of the monorepo', async () => {
      // given
      await aMonorepo()
        .named('root')
        .withConfigFile(
          `module.exports = {
          babelConfigModifier: () => ({
            presets: [
              [
                'env',
                {
                  targets: {
                    node: '6.10',
                  },
                  modules: false,
                },
              ],
              'flow',
            ],
          }),
        };`
        )
        .withDevDependencies({
          'babel-core': '^6.26.0',
          'babel-loader': '^7.1.2',
          'babel-preset-env': '^1.6.1',
          'babel-preset-flow': '^6.23.0',
        })
        .withSource(
          'main.js',
          `
            // @flow
            type Something = number;
            function doSomething(something: Something): Something {
              return something + something;
            }
            console.log(doSomething(5));
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
          expect(compilationOutput).to.include(
            'monopack successfully packaged your app'
          );
          expect(result).to.deep.equal({ type: 'EXIT', exitCode: 0 });
          expect(stdout).to.equal('10\n');
          expect(stderr).to.equal('');
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
          expect(compilationOutput).to.include(
            'monopack successfully packaged your app'
          );
          expect(stderr).to.equal('');
          expect(result).to.deep.equal({ type: 'EXIT', exitCode: 0 });
          expect(stdout).to.equal('ok\n');
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
          expect(compilationOutput).to.include(
            'monopack successfully packaged your app'
          );
          expect(stderr).to.equal('');
          expect(result).to.deep.equal({ type: 'EXIT', exitCode: 0 });
          expect(stdout).to.equal('ok\n');
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
          expect(stderr).to.equal('');
          expect(stdout).to.equal('false\n');
          expect(result).to.deep.equal({ type: 'EXIT', exitCode: 0 });
        });
    });

    xit('should build a js file using a third-party package', async () => {});

    xit('should build a js file to a temp directory', async () => {});

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
  mainJs: string
): Promise<{
  compilationOutput: string,
}> {
  let compilationOutput = '';
  await main({
    watch: false,
    print: content => {
      compilationOutput = compilationOutput + content;
    },
    outputDirectory: './build',
    mainJs,
    currentWorkingDirectory: root,
    command: 'build',
  });
  return { compilationOutput };
}
