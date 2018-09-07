// @flow
import fs from 'fs';
import path from 'path';

import { aMonorepo } from 'monopack-repo-builder';

import { build } from './monopack-build-helper';

jest.setTimeout(60000);

describe('monopack build - afterBuild', () => {
  it('should create a temp file synchronously', async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(
        `
        const fs = require('fs');
        const path = require('path');
        module.exports = {afterBuild: (outputDirectory) => {
          fs.writeFileSync(path.join(outputDirectory, 'output.txt'), outputDirectory);
      }};`
      )
      .withSource(
        'main.js',
        `
            console.log('ok');
          `
      )
      .execute(async ({ root }) => {
        // when
        const { buildDirectory } = await build(root, 'main.js', {});

        expect(fs.existsSync(path.join(buildDirectory, 'output.txt'))).toBe(
          true
        );
        const content = fs.readFileSync(
          path.join(buildDirectory, 'output.txt'),
          'utf8'
        );
        expect(content).toEqual(buildDirectory);
      });
  });

  it('should create a temp file asynchronously', async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(
        `
        const fs = require('fs');
        const path = require('path');
        module.exports = {afterBuild: (outputDirectory) => {
          return new Promise((resolve, reject) => {
            fs.writeFile(path.join(outputDirectory, 'output.txt'), outputDirectory, (err, data) => {
              if (err) {
                reject(err);
              } else {
                resolve(data);
              }
            });
          });
      }};`
      )
      .withSource(
        'main.js',
        `
            console.log('ok');
          `
      )
      .execute(async ({ root }) => {
        // when
        const { buildDirectory } = await build(root, 'main.js', {});

        expect(fs.existsSync(path.join(buildDirectory, 'output.txt'))).toBe(
          true
        );
        const content = fs.readFileSync(
          path.join(buildDirectory, 'output.txt'),
          'utf8'
        );
        expect(content).toEqual(buildDirectory);
      });
  });
});
