// @flow
import fs from 'fs';
import path from 'path';

import { aMonorepo } from 'monopack-repo-builder';

import { monopack } from './monopack-helper';

jest.setTimeout(60000);

describe('monopack debug', () => {
  it('should build and debug a js file', async () => {
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
          command: 'debug',
        });

        // then
        expect(success).toBe(true);
        expect(exitCode).toBe(0);
        expect(compilationOutput).toContain(
          'monopack will run $ node --inspect main.js'
        );
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

  it('should build and debug a js file with the debug-host-port option', async () => {
    // given
    await aMonorepo()
      .named('root')
      .withEmptyConfigFile()
      .withSource(
        'main.js',
        `
          console.log('ok');
        `
      )
      .execute(async ({ root }) => {
        // when
        const { compilationOutput, success, exitCode } = await monopack(
          root,
          'main.js',
          {
            command: 'debug',
            debugOptions: { debugHostPort: 'localhost:1337' },
          }
        );

        // then
        expect(success).toBe(true);
        expect(exitCode).toBe(0);
        expect(compilationOutput).toContain(
          'monopack will run $ node --inspect --inspect-port=localhost:1337 main.js'
        );
        expect(compilationOutput).toContain(
          'Debugger listening on ws://localhost:1337/'
        );
      });
  });
});
