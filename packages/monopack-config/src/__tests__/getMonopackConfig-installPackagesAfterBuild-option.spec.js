// @flow
import { aMonorepo } from 'monopack-repo-builder';

import { getMonopackConfig } from '..';

jest.setTimeout(60000);

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
