// @flow
import { expect } from 'chai';
import { executeChildProcess } from 'monopack-process';
import type { ExitOrSignal } from 'monopack-process';
import { aMonorepo } from 'monopack-repo-builder';

import { main } from '../main';

describe('monopack build', () => {
  describe('validation', () => {
    xit('should reject building a non-existing file', async () => {});

    xit('should reject building a file outside the monorepo', async () => {});
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
          const { buffer, result, stdout, stderr } = await buildAndRun(root);

          // then
          expect(buffer).to.include('monopack successfully packaged your app');
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
          const { buffer, result, stdout, stderr } = await buildAndRun(root);

          // then
          expect(buffer).to.include('monopack successfully packaged your app');
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
          const { buffer, result, stdout, stderr } = await buildAndRun(root);

          // then
          expect(buffer).to.include('monopack successfully packaged your app');
          expect(result).to.deep.equal({ type: 'EXIT', exitCode: 0 });
          expect(stdout).to.equal('10\n');
          expect(stderr).to.equal('');
        });
    });

    xit('should build a js file using another package from the monorepo', async () => {});

    xit('should build a js file using a third-party package', async () => {});

    xit('should build a js file using a nodejs module', async () => {});

    xit('should build a js file to a temp directory', async () => {});

    xit('should build a js file, watch for file changes and rebuild on file changes', async () => {});
  });
});

async function buildAndRun(
  root: string
): Promise<{
  buffer: string,
  result: ExitOrSignal,
  stdout: string,
  stderr: string,
}> {
  let buffer = '';
  await main({
    watch: false,
    println: content => {
      buffer = buffer + content;
    },
    outputDirectory: './build',
    mainJs: 'main.js',
    currentWorkingDirectory: root,
    command: 'build',
  });
  const { result, stdout, stderr } = await executeChildProcess(
    'node',
    ['./build/main.js'],
    { cwd: root }
  );
  return { buffer, result, stdout, stderr };
}
