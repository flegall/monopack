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
});
