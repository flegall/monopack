// @flow
import fs from 'fs';
import path from 'path';

import { executeChildProcess } from 'monopack-process';
import { aMonorepo } from 'monopack-repo-builder';

import { build } from './monopack-build-helper';

jest.setTimeout(60000);

describe('monopack build - third party packages', () => {
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
        const { buildDirectory } = await build(root, 'main.js', {});
        const { result, stdout, stderr } = await executeChildProcess(
          'node',
          [path.join(buildDirectory, 'main.js')],
          { cwd: root }
        );

        // then
        expect(stderr).toBe('');
        expect(stdout).toBe('4.17.5\n');
        expect(result).toEqual({ type: 'EXIT', exitCode: 0 });
        expect(fs.existsSync(path.join(buildDirectory, 'node_modules'))).toBe(
          true
        );
      });
  });

  it('should build a js file without installing packages', async () => {
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
        const { compilationOutput, buildDirectory } = await build(
          root,
          'main.js',
          {
            installPackages: false,
          }
        );

        // then
        expect(compilationOutput).toContain(
          'monopack successfully packaged your app'
        );
        expect(fs.existsSync(path.join(buildDirectory, 'node_modules'))).toBe(
          false
        );
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
        const { buildDirectory } = await build(root, 'main.js', {
          extraModules: ['lodash'],
        });

        // then
        const packageJson = JSON.parse(
          fs.readFileSync(path.join(buildDirectory, 'package.json'), 'utf8')
        );
        expect(packageJson.dependencies.lodash).toBe('4.17.5');
        expect(
          fs.existsSync(path.join(buildDirectory, 'node_modules', 'lodash'))
        ).toBe(true);
      });
  });
});
