// @flow
import { aMonorepo, aPackage } from 'monopack-repo-builder';

import { getMonopackConfig } from '..';

jest.setTimeout(60000);

describe('getMonopackConfig() - monorepo root resolution - lerna', () => {
  it(`when a local monopack.config.js not defining the monorepo root is present
    if there is a lerna.json file upwards,
    it should define the mono repo root where lerna.json is found`, async () => {
    await aMonorepo()
      .withLernaJsonFile()
      .withPackages(aPackage().withEmptyConfigFile())
      .execute(async ({ root, packages: [subPackagePath] }) => {
        // when
        const config = getMonopackConfig(
          subPackagePath + '/main.js',
          false,
          []
        );

        // then
        expect(config.monorepoRootPath).toBe(root);
        const ref = {}; // Verify that the config is not modified
        expect(config.babelConfigModifier(ref)).toBe(ref);
        expect(config.webpackConfigModifier(ref)).toBe(ref);
      });
  });

  it(`when no file exists if there is a lerna.json file upwards,
    it should use default configuration and define monorepo root where lerna.json is found`, async () => {
    await aMonorepo()
      .withLernaJsonFile()
      .withPackages(aPackage())
      .execute(async ({ root, packages: [subPackagePath] }) => {
        // when
        const config = getMonopackConfig(
          subPackagePath + '/main.js',
          false,
          []
        );

        // then
        expect(config.monorepoRootPath).toBe(root);
        const ref = {}; // Verify that the config is not modified
        expect(config.babelConfigModifier(ref)).toBe(ref);
        expect(config.webpackConfigModifier(ref)).toBe(ref);
      });
  });
});
