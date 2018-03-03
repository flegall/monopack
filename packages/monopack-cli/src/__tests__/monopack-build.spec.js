// @flow
import { expect } from 'chai';
import { executeChildProcess } from 'monopack-process';
import { aMonorepo } from 'monopack-repo-builder';

import { main } from '../main';

describe('monopack build', () => {
  describe('validation', () => {
    it('should reject building a non-existing file', async () => {});

    it('should reject building a file outside the monorepo', async () => {});
  });
  describe('command', () => {
    it('should build a js file at the top of the monorepo', async () => {
      // given
      await aMonorepo()
        .named('root')
        .withEmptyConfigFile()
        .withSource('main.js', `console.log('ok');`)
        .execute(async ({ root }) => {
          let buffer = '';

          // when
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
          let buffer = '';

          // when
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

          // then
          expect(buffer).to.include('monopack successfully packaged your app');
          expect(result).to.deep.equal({ type: 'EXIT', exitCode: 0 });
          expect(stdout).to.equal('ok\n');
          expect(stderr).to.equal('');
        });
    });

    it('should build a js file using another package from the monorepo', async () => {});

    it('should build a js file using a third-party package', async () => {});

    it('should build a js file using a nodejs module', async () => {});

    it('should build a js file to a temp directory', async () => {});

    it('should build a js file, watch for file changes and rebuild on file changes', async () => {});
  });
});
