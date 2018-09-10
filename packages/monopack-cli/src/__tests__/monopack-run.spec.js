// @flow
import fs from 'fs';
import path from 'path';

import { aMonorepo } from 'monopack-repo-builder';

import { monopack } from './monopack-helper';

jest.setTimeout(60000);

describe('monopack run', () => {
  it('should build and run a js file', async () => {
    // given
    await aMonorepo()
      .named('root')
      .withEmptyConfigFile()
      .withSource(
        'main.js',
        `
          const fs = require('fs');
          const path = require('path')
          fs.writeFileSync(path.join(process.cwd(), 'output.txt'), 'ok');
        `
      )
      .execute(async ({ root }) => {
        // when
        const {
          buildDirectory,
          compilationOutput,
          success,
          exitCode,
        } = await monopack(root, 'main.js', {
          command: 'run',
        });

        // then
        expect(success).toBe(true);
        expect(exitCode).toBe(0);
        expect(compilationOutput).toContain('monopack will run $ node main.js');
        expect(fs.existsSync(path.join(buildDirectory, 'output.txt'))).toBe(
          true
        );
        const content = fs.readFileSync(
          path.join(buildDirectory, 'output.txt'),
          'utf8'
        );
        expect(content).toEqual('ok');
      });
  });

  it('should build and run a js file with run arguments', async () => {
    // given
    await aMonorepo()
      .named('root')
      .withEmptyConfigFile()
      .withSource(
        'main.js',
        `
          const fs = require('fs');
          const path = require('path');
          const helloArg = process.argv[2];
          const worldArg = process.argv[3];
          fs.writeFileSync(path.join(process.cwd(), 'output.txt'), JSON.stringify([helloArg, worldArg]));
        `
      )
      .execute(async ({ root }) => {
        // when
        const {
          buildDirectory,
          compilationOutput,
          success,
          exitCode,
        } = await monopack(root, 'main.js', {
          command: 'run',
          runArgs: ['hello', 'world'],
        });

        // then
        expect(success).toBe(true);
        expect(exitCode).toBe(0);
        expect(compilationOutput).toContain(
          'monopack will run $ node main.js hello world'
        );
        expect(fs.existsSync(path.join(buildDirectory, 'output.txt'))).toBe(
          true
        );
        const content = fs.readFileSync(
          path.join(buildDirectory, 'output.txt'),
          'utf8'
        );
        expect(content).toEqual('["hello","world"]');
      });
  });

  it('should build and run a js file with nodejs arguments', async () => {
    // given
    await aMonorepo()
      .named('root')
      .withEmptyConfigFile()
      .withSource(
        'main.js',
        `
          console.log('OK');
        `
      )
      .execute(async ({ root }) => {
        // when
        const { compilationOutput, success, exitCode } = await monopack(
          root,
          'main.js',
          {
            command: 'run',
            nodeArgs: ['--max-old-space-size=128'],
          }
        );

        // then
        expect(success).toBe(true);
        expect(exitCode).toBe(0);
        expect(compilationOutput).toContain(
          'monopack will run $ node --max-old-space-size=128 main.js'
        );
      });
  });

  it('should build and run a js file that exits with an exit code and propagate exit code', async () => {
    // given
    await aMonorepo()
      .named('root')
      .withEmptyConfigFile()
      .withSource(
        'main.js',
        `
          process.exit(42);
        `
      )
      .execute(async ({ root }) => {
        // when
        const { success, exitCode } = await monopack(root, 'main.js', {
          command: 'run',
        });

        // then
        expect(success).toBe(false);
        expect(exitCode).toBe(42);
      });
  });
});
