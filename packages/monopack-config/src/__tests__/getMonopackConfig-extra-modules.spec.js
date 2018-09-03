// @flow
import { aMonorepo } from 'monopack-repo-builder';

import { getMonopackConfig } from '..';

jest.setTimeout(60000);

describe('getMonopackConfig() - extraModules option', () => {
  it(`when no config file is present
    and no extraModules is provided in the cli, 
    the default value should be []`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .execute(async ({ root }) => {
        // when
        const config = getMonopackConfig(root + '/main.js', null, []);

        // then
        expect(config.extraModules).toEqual([]);
      });
  });

  it(`when no extraModules option is provided is provided in the config file 
    and no extraModules is provided in the cli, 
    the default value should be []`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {};`)
      .execute(async ({ root }) => {
        // when
        const config = getMonopackConfig(root + '/main.js', null, []);

        // then
        expect(config.extraModules).toEqual([]);
      });
  });

  it(`when an extraModules option is provided is provided in the config file 
    and no extraModules is provided in the cli, 
    the value should be the one provided in the config files`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {extraModules: ['lodash']};`)
      .execute(async ({ root }) => {
        // when
        const config = getMonopackConfig(root + '/main.js', null, []);

        // then
        expect(config.extraModules).toEqual(['lodash']);
      });
  });

  it(`when no extraModules option is provided is provided in the config file 
    and an extraModules is provided in the cli, 
    the value should be the one provided in the cli`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {};`)
      .execute(async ({ root }) => {
        // when
        const config = getMonopackConfig(root + '/main.js', null, ['lodash']);

        // then
        expect(config.extraModules).toEqual(['lodash']);
      });
  });

  it(`when no config file is provided
    and an extraModules is provided in the cli, 
    the value should be the one provided in the cli`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {};`)
      .execute(async ({ root }) => {
        // when
        const config = getMonopackConfig(root + '/main.js', null, ['lodash']);

        // then
        expect(config.extraModules).toEqual(['lodash']);
      });
  });

  it(`when an extraModules option is provided is provided in the config file 
    and an extraModules is provided in the cli, 
    the two values should be merged`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {extraModules: ['ramda']};`)
      .execute(async ({ root }) => {
        // when
        const config = getMonopackConfig(root + '/main.js', null, ['lodash']);

        // then
        expect(config.extraModules).toEqual(['ramda', 'lodash']);
      });
  });
});
