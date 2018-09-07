// @flow
import { aMonorepo } from 'monopack-repo-builder';

import { getMonopackConfig } from '..';

jest.setTimeout(60000);

describe('getMonopackConfig() - modifyPackageJson', () => {
  it(`when no config file is present
   an identity function should be provided`, async () => {
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
        const ref = {}; // Verify that the config is not modified
        expect(config.modifyPackageJson(ref)).toBe(ref);
      });
  });

  it(`when an empty config file is present
   an identity function should be provided`, async () => {
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
        const ref = {}; // Verify that the config is not modified
        expect(config.modifyPackageJson(ref)).toBe(ref);
      });
  });

  it(`when a config file is present, providing a modifyPackageJson
   it should be provided`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(
        `module.exports = {modifyPackageJson: () => {
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
        const ref = {}; // Verify that the implementation is used
        expect(config.modifyPackageJson(ref)).toEqual({ ok: 42 });
      });
  });
});
