// @flow
import fs from 'fs';
import path from 'path';

import Bluebird from 'bluebird';
import { aMonorepo } from 'monopack-repo-builder';

import { getMonopackConfig } from '..';

jest.setTimeout(60000);

const writeFile: (
  string | Buffer | number,
  string | Buffer | Uint8Array,
  Object | string | void
) => Promise<void> = Bluebird.promisify(fs.writeFile);

describe('getMonopackConfig() - outputDirectory option', () => {
  it(`when no config file is present
    and no outputDirectory is provided in the cli, 
    the default value should be null`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .execute(async ({ root }) => {
        // when
        const config = getMonopackConfig({
          mainFilePath: root + '/main.js',
          installPackages: null,
          extraModules: [],
          outputDirectory: null,
        });

        // then
        expect(config.outputDirectory).toEqual(null);
      });
  });

  it(`when no outputDirectory option is provided in the config file 
    and no outputDirectory is provided in the cli, 
    the default value should be null`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {};`)
      .execute(async ({ root }) => {
        // when
        const config = getMonopackConfig({
          mainFilePath: root + '/main.js',
          installPackages: null,
          extraModules: [],
          outputDirectory: null,
        });

        // then
        expect(config.outputDirectory).toEqual(null);
      });
  });

  it(`when an outputDirectory option is provided in the config file 
    and no outputDirectory is provided in the cli, 
    the value should be the one provided in the config file`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {outputDirectory: './output'};`)
      .execute(async ({ root }) => {
        // when
        const config = getMonopackConfig({
          mainFilePath: root + '/main.js',
          installPackages: null,
          extraModules: [],
          outputDirectory: null,
        });
        // then
        expect(config.outputDirectory).toEqual(path.join(root, './output'));
      });
  });

  it(`when an absolute outputDirectory option is provided in the config file 
    and no outputDirectory is provided in the cli, 
    the value should be the absolute path provided in the config file`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .execute(async ({ root }) => {
        await writeFile(
          path.join(root, '/monopack.config.js'),
          `module.exports = ${JSON.stringify({
            outputDirectory: path.join(root, './output'),
          })}`
        );
        // when
        const config = getMonopackConfig({
          mainFilePath: root + '/main.js',
          installPackages: null,
          extraModules: [],
          outputDirectory: null,
        });
        // then
        expect(config.outputDirectory).toEqual(path.join(root, './output'));
      });
  });

  it(`when no outputDirectory option is provided in the config file 
    and an outputDirectory is provided in the cli, 
    the value should be the one provided in the cli`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {};`)
      .execute(async ({ root }) => {
        // when
        const config = getMonopackConfig({
          mainFilePath: root + '/main.js',
          installPackages: null,
          extraModules: [],
          outputDirectory: '/path/to/output/directory',
        });
        // then
        expect(config.outputDirectory).toEqual('/path/to/output/directory');
      });
  });

  it(`when no config file is provided
    and an outputDirectory is provided in the cli, 
    the value should be the one provided in the cli`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .execute(async ({ root }) => {
        // when
        const config = getMonopackConfig({
          mainFilePath: root + '/main.js',
          installPackages: null,
          extraModules: [],
          outputDirectory: '/path/to/output/directory',
        });
        // then
        expect(config.outputDirectory).toEqual('/path/to/output/directory');
      });
  });

  it(`when an outputDirectory option is provided in the config file 
    and an outputDirectory is provided in the cli, 
    the value should be the one provided in the cli`, async () => {
    // given
    await aMonorepo()
      .named('root')
      .withConfigFile(`module.exports = {outputDirectory: './output'};`)
      .execute(async ({ root }) => {
        // when
        const config = getMonopackConfig({
          mainFilePath: root + '/main.js',
          installPackages: null,
          extraModules: [],
          outputDirectory: '/path/to/output/directory',
        });
        // then
        expect(config.outputDirectory).toEqual('/path/to/output/directory');
      });
  });
});
