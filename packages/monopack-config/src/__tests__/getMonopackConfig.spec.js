// @flow
import { aMonorepo, aPackage } from 'monopack-repo-builder';

import { getMonopackConfig } from '..';

jest.setTimeout(30000);

describe('getMonopackConfig() - monorepo root resolution', () => {
  it(`when no local config is present if a top-level monopack.config.js is present,
     it should use it`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {monorepoRootPath: '.'};`)
      .withPackages(aPackage().named('child'))
      .execute(async ({ root, packages: [subPackagePath] }) => {
        // when
        const config = getMonopackConfig(subPackagePath + '/main.js');

        // then
        expect(config.monorepoRootPath).toBe(root);
        const ref = {}; // Verify that the config is not modified
        expect(config.babelConfigModifier(ref)).toBe(ref);
        expect(config.webpackConfigModifier(ref)).toBe(ref);
      });
  });

  it(`when a local monopack.config.js defining the monorepo root is present,
    it should use it even if there are top-level config files`, async () => {
    // given
    await aMonorepo()
      .withEmptyConfigFile()
      .withPackages(
        aPackage().withConfigFile(
          `module.exports = {monorepoRootPath: '../..'};`
        )
      )
      .execute(async ({ root, packages: [subPackagePath] }) => {
        // when
        const config = getMonopackConfig(subPackagePath + '/main.js');

        // then
        expect(config.monorepoRootPath).toBe(root);
        const ref = {}; // Verify that the config is not modified
        expect(config.babelConfigModifier(ref)).toBe(ref);
        expect(config.webpackConfigModifier(ref)).toBe(ref);
      });
  });

  it(`when a local monopack.config.js not defining the monorepo root is present
    if there is a lerna.json file upwards,
    it should define the mono repo root where lerna.json is found`, async () => {
    await aMonorepo()
      .withLernaJsonFile()
      .withPackages(aPackage().withEmptyConfigFile())
      .execute(async ({ root, packages: [subPackagePath] }) => {
        // when
        const config = getMonopackConfig(subPackagePath + '/main.js');

        // then
        expect(config.monorepoRootPath).toBe(root);
        const ref = {}; // Verify that the config is not modified
        expect(config.babelConfigModifier(ref)).toBe(ref);
        expect(config.webpackConfigModifier(ref)).toBe(ref);
      });
  });

  it(`when a local monopack.config.js not defining the monorepo root is present,
    if there is no lerna.json file upwards,
    if there is package.json with yarn workspaces upwards,
    it should define the mono repo root on the workspaces root`, async () => {
    await aMonorepo()
      .withWorkspacesEnabled()
      .withPackages(aPackage().withEmptyConfigFile())
      .execute(async ({ root, packages: [subPackagePath] }) => {
        // when
        const config = getMonopackConfig(subPackagePath + '/main.js');

        // then
        expect(config.monorepoRootPath).toBe(root);
        const ref = {}; // Verify that the config is not modified
        expect(config.babelConfigModifier(ref)).toBe(ref);
        expect(config.webpackConfigModifier(ref)).toBe(ref);
      });
  });

  it(`when a local monopack.config.js not defining the monorepo root is present,
    if there are no lerna.json nor yarn workspaces,
    it should define the mono repo root on the workspaces root`, async () => {
    await aMonorepo()
      .withPackages(aPackage().withEmptyConfigFile())
      .execute(async ({ root, packages: [subPackagePath] }) => {
        // when
        const config = getMonopackConfig(subPackagePath + '/main.js');

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
        const config = getMonopackConfig(subPackagePath + '/main.js');

        // then
        expect(config.monorepoRootPath).toBe(root);
        const ref = {}; // Verify that the config is not modified
        expect(config.babelConfigModifier(ref)).toBe(ref);
        expect(config.webpackConfigModifier(ref)).toBe(ref);
      });
  });

  it(`when no file exists and there is no lerna.json
      if there is package.json with yarn workspaces upwards,
    it should use default configuration and define monorepo root on the workspaces root`, async () => {
    await aMonorepo()
      .withWorkspacesEnabled()
      .withPackages(aPackage())
      .execute(async ({ root, packages: [subPackagePath] }) => {
        // when
        const config = getMonopackConfig(subPackagePath + '/main.js');

        // then
        expect(config.monorepoRootPath).toBe(root);
        const ref = {}; // Verify that the config is not modified
        expect(config.babelConfigModifier(ref)).toBe(ref);
        expect(config.webpackConfigModifier(ref)).toBe(ref);
      });
  });

  it(`when no file exists
      and there is no lerna.json nor yarn workspaces,
    it should use default configuration and define monorepo root at the top-most package json level, `, async () => {
    await aMonorepo()
      .withPackages(aPackage())
      .execute(async ({ root, packages: [subPackagePath] }) => {
        // when
        const config = getMonopackConfig(subPackagePath + '/main.js');

        // then
        expect(config.monorepoRootPath).toBe(root);
        const ref = {}; // Verify that the config is not modified
        expect(config.babelConfigModifier(ref)).toBe(ref);
        expect(config.webpackConfigModifier(ref)).toBe(ref);
      });
  });
});

describe('getMonopackConfig() - config file validation', () => {
  it(`when an invalid value for 'monorepoRootPath' is given, it should be rejected`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {monorepoRootPath: 1};`)
      .execute(async ({ root }) => {
        // when
        let error;
        try {
          getMonopackConfig(root + '/main.js');
        } catch (e) {
          error = e;
        }

        // then
        expect(error).toBeDefined();
        if (error) {
          expect(error.message).toContain(
            '"Invalid value 1 supplied to /monorepoRootPath: String | Nil'
          );
        }
      });
  });

  it(`when an invalid value for 'webpackConfigModifier' is given, it should be rejected`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {webpackConfigModifier: 1};`)
      .execute(async ({ root }) => {
        // when
        let error;
        try {
          getMonopackConfig(root + '/main.js');
        } catch (e) {
          error = e;
        }

        // then
        expect(error).toBeDefined();
        if (error) {
          expect(error.message).toContain(
            '"Invalid value 1 supplied to /webpackConfigModifier: Function | Nil'
          );
        }
      });
  });

  it(`when an invalid value for 'babelConfigModifier' is given, it should be rejected`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {babelConfigModifier: 1};`)
      .execute(async ({ root }) => {
        // when
        let error;
        try {
          getMonopackConfig(root + '/main.js');
        } catch (e) {
          error = e;
        }

        // then
        expect(error).toBeDefined();
        if (error) {
          expect(error.message).toContain(
            '"Invalid value 1 supplied to /babelConfigModifier: Function | Nil'
          );
        }
      });
  });
});
