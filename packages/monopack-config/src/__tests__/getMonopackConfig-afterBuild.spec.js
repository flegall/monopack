// @flow
import { aMonorepo } from 'monopack-repo-builder';

import { getMonopackConfig } from '..';

jest.setTimeout(60000);

describe('getMonopackConfig() - afterBuild', () => {
  it(`when no config file is present
   a null value should be provided`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .execute(async ({ root }) => {
        // when
        const config = getMonopackConfig({
          mainFilePath: root + '/main.js',
          installPackages: false,
          extraModules: [],
          outputDirectory: null,
        });

        // then
        const { afterBuild } = config;
        expect(afterBuild).toBe(null);
      });
  });

  it(`when an empty config file is present
   a null value should be provided`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withEmptyConfigFile()
      .execute(async ({ root }) => {
        // when
        const config = getMonopackConfig({
          mainFilePath: root + '/main.js',
          installPackages: false,
          extraModules: [],
          outputDirectory: null,
        });

        // then
        const { afterBuild } = config;
        expect(afterBuild).toBe(null);
      });
  });

  it(`when an config file is present, providing a afterBuild function that returns a value
   it should be provided`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(
        `module.exports = {afterBuild: () => {
        return {ok: 42};
      }};`
      )
      .execute(async ({ root }) => {
        // when
        const config = getMonopackConfig({
          mainFilePath: root + '/main.js',
          installPackages: false,
          extraModules: [],
          outputDirectory: null,
        });

        // then
        const { afterBuild } = config;
        expect(afterBuild).not.toBeNull();
        if (afterBuild) {
          expect(afterBuild(root)).toEqual({ ok: 42 });
        }
      });
  });
});
