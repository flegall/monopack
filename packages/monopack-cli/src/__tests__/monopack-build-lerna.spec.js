// @flow

import { aMonorepo, aPackage } from 'monopack-repo-builder';

import { buildAndRun } from './monopack-build-helper';

jest.setTimeout(60000);

describe('monopack build - lerna', () => {
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
        const { compilationOutput, result, stdout, stderr } = await buildAndRun(
          root,
          './packages/test-mp-main/main.js'
        );

        // then
        expect(compilationOutput).toContain(
          'monopack successfully packaged your app'
        );
        expect(stderr).toBe('');
        expect(result).toEqual({ type: 'EXIT', exitCode: 0 });
        expect(stdout).toBe('ok\n');
      });
  });
});
