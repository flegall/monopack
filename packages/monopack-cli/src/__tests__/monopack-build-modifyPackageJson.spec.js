// @flow
import fs from 'fs';
import path from 'path';

import { aMonorepo } from 'monopack-repo-builder';

import { monopack } from './monopack-helper';

jest.setTimeout(60000);

describe('monopack build - modifyPackageJson', () => {
  it('should modify the package json by mutating it', async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(
        `module.exports = {modifyPackageJson: (pkg) => {
        pkg.modified = true;
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
        const { buildDirectory } = await monopack(root, 'main.js', {
          command: 'build',
        });

        const packageJson = JSON.parse(
          fs.readFileSync(path.join(buildDirectory, 'package.json'), 'utf8')
        );
        expect(packageJson.modified).toBe(true);
      });
  });

  it('should modify the package json by returning a modified version', async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(
        `module.exports = {modifyPackageJson: (pkg) => {
        return Object.assign({}, pkg, {modified: true});
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
        const { buildDirectory } = await monopack(root, 'main.js', {
          command: 'build',
        });

        const packageJson = JSON.parse(
          fs.readFileSync(path.join(buildDirectory, 'package.json'), 'utf8')
        );
        expect(packageJson.modified).toBe(true);
      });
  });
});
