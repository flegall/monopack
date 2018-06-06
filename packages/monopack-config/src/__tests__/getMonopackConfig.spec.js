// @flow
import { aMonorepo, aPackage } from 'monopack-repo-builder';

import { getMonopackConfig } from '..';

jest.setTimeout(60000);

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
        const config = getMonopackConfig(subPackagePath + '/main.js', false);

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
        const config = getMonopackConfig(subPackagePath + '/main.js', false);

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
        const config = getMonopackConfig(subPackagePath + '/main.js', false);

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
        const config = getMonopackConfig(subPackagePath + '/main.js', false);

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
        const config = getMonopackConfig(subPackagePath + '/main.js', false);

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
        const config = getMonopackConfig(subPackagePath + '/main.js', false);

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
        const config = getMonopackConfig(subPackagePath + '/main.js', false);

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
        const config = getMonopackConfig(subPackagePath + '/main.js', false);

        // then
        expect(config.monorepoRootPath).toBe(root);
        const ref = {}; // Verify that the config is not modified
        expect(config.babelConfigModifier(ref)).toBe(ref);
        expect(config.webpackConfigModifier(ref)).toBe(ref);
      });
  });
});

describe('getMonopackConfig() - installPackagesAfterBuild option', () => {
  it('when no installPackagesAfterBuild option is provided is provided in the config file, the default value should be true', async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {};`)
      .execute(async ({ root }) => {
        // when
        const config = getMonopackConfig(root + '/main.js', null);

        // then
        expect(config.installPackagesAfterBuild).toBe(true);
      });
  });

  it(`when no installPackagesAfterBuild option is provided is provided in the config file 
  and the noPackagesInstallation is provided in the cli, 
  the default value should be false`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {};`)
      .execute(async ({ root }) => {
        // when
        const config = getMonopackConfig(root + '/main.js', false);

        // then
        expect(config.installPackagesAfterBuild).toBe(false);
      });
  });

  it(`when no installPackagesAfterBuild option is provided is provided in the config file 
  and the installPackages options is provided in the cli, 
  the default value should be true`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {};`)
      .execute(async ({ root }) => {
        // when
        const config = getMonopackConfig(root + '/main.js', true);

        // then
        expect(config.installPackagesAfterBuild).toBe(true);
      });
  });

  it('when an installPackagesAfterBuild option is provided in the config file to true, the value should be true', async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {installPackagesAfterBuild: true};`)
      .execute(async ({ root }) => {
        // when
        const config = getMonopackConfig(root + '/main.js', null);

        // then
        expect(config.installPackagesAfterBuild).toBe(true);
      });
  });

  it(`when an installPackagesAfterBuild option is provided in the config file to true,  
    and the noPackagesInstallation option is provided in the cli, 
    the value should be false`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {installPackagesAfterBuild: true};`)
      .execute(async ({ root }) => {
        // when
        const config = getMonopackConfig(root + '/main.js', false);

        // then
        expect(config.installPackagesAfterBuild).toBe(false);
      });
  });

  it('when an installPackagesAfterBuild option is provided in the config file to false, the value should be false', async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {installPackagesAfterBuild: false};`)
      .execute(async ({ root }) => {
        // when
        const config = getMonopackConfig(root + '/main.js', null);

        // then
        expect(config.installPackagesAfterBuild).toBe(false);
      });
  });

  it(`when an installPackagesAfterBuild option is provided in the config file to false, 
    and the noPackagesInstallation option is provided in the cli, 
    the value should be false`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {installPackagesAfterBuild: false};`)
      .execute(async ({ root }) => {
        // when
        const config = getMonopackConfig(root + '/main.js', false);

        // then
        expect(config.installPackagesAfterBuild).toBe(false);
      });
  });

  it(`when an installPackagesAfterBuild option is provided in the config file to false, 
    and the installPackages option is provided in the cli, 
    the value should be true`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {installPackagesAfterBuild: false};`)
      .execute(async ({ root }) => {
        // when
        const config = getMonopackConfig(root + '/main.js', true);

        // then
        expect(config.installPackagesAfterBuild).toBe(true);
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
          getMonopackConfig(root + '/main.js', false);
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
          getMonopackConfig(root + '/main.js', false);
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

  it(`when an invalid value for 'installPackagesAfterBuild' is given, it should be rejected`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {installPackagesAfterBuild: 1};`)
      .execute(async ({ root }) => {
        // when
        let error;
        try {
          getMonopackConfig(root + '/main.js', false);
        } catch (e) {
          error = e;
        }

        // then
        expect(error).toBeDefined();
        if (error) {
          expect(error.message).toContain(
            '"Invalid value 1 supplied to /installPackagesAfterBuild: Boolean | Nil'
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
          getMonopackConfig(root + '/main.js', false);
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
