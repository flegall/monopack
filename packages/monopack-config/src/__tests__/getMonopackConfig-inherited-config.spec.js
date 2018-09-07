// @flow
import path from 'path';

import { aMonorepo, aPackage } from 'monopack-repo-builder';

import { getMonopackConfig } from '..';

jest.setTimeout(60000);

describe('getMonopackConfig() - inherited config', () => {
  it(`when two config files are present
    their content is merged and the most local file overrides the other`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(
        `module.exports = {extraModules: ['mysql'], installPackagesAfterBuild: true};`
      )
      .withPackages(
        aPackage().withConfigFile(
          `module.exports = { installPackagesAfterBuild: false};`
        )
      )
      .execute(async ({ root, packages: [subPackagePath] }) => {
        // when
        const config = getMonopackConfig({
          mainFilePath: subPackagePath + '/main.js',
          installPackages: null,
          extraModules: [],
          outputDirectory: null,
        });

        // then
        expect(config.extraModules).toEqual(['mysql']);
        expect(config.installPackagesAfterBuild).toBe(false);
      });
  });

  it(`when two config files are present, 
    and a subpackage config is defined with relative paths
    relative paths are resolved according to the subpackage`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(
        `module.exports = {monorepoRootPath: '.', outputDirectory: './build'};`
      )
      .withPackages(
        aPackage().withConfigFile(
          `module.exports = { monorepoRootPath: '.', outputDirectory: './build'};`
        )
      )
      .execute(async ({ root, packages: [subPackagePath] }) => {
        // when
        const config = getMonopackConfig({
          mainFilePath: subPackagePath + '/main.js',
          installPackages: null,
          extraModules: [],
          outputDirectory: null,
        });

        // then
        expect(config.monorepoRootPath).toEqual(subPackagePath);
        expect(config.outputDirectory).toEqual(
          path.join(subPackagePath, './build')
        );
      });
  });
});
