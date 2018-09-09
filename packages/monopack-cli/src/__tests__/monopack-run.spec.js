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
        const { buildDirectory } = await monopack(root, 'main.js', {
          command: 'run',
        });

        // then
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

  it('should build and run a js file with arguments', async () => {
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
        const { buildDirectory } = await monopack(root, 'main.js', {
          command: 'run',
          runArgs: ['hello', 'world'],
        });

        // then
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
});
