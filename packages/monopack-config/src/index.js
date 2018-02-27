// @flow
import fs from 'fs';
import path from 'path';

import t from 'tcomb-validation';

export type MonopackConfig = {
  +monorepoRootPath: string,
  +webpackConfigModifier: Object => Object,
  +babelConfigModifier: Object => Object,
};

export async function getMonopackConfig(
  mainFilePath: string
): Promise<MonopackConfig> {
  const directory = path.dirname(mainFilePath);
  const monopackConfigFile = await lookupMonopackConfig(directory);
  if (monopackConfigFile) {
    return buildConfigFromConfigFile(monopackConfigFile);
  }
  throw new Error('Failed');
}

async function lookupMonopackConfig(directory: string): Promise<?string> {
  const monopackFilePath = path.join(directory, 'monopack.config.js');
  if (fs.existsSync(monopackFilePath)) {
    return monopackFilePath;
  }

  const parentDir = path.resolve(directory, '..');
  if (parentDir === directory) {
    return undefined;
  } else {
    return lookupMonopackConfig(parentDir);
  }
}

type ConfigFile = {
  +monorepoRootPath?: string,
  +webpackConfigModifier?: Object => Object,
  +babelConfigModifier?: Object => Object,
};
const ConfigFileTCombType = t.struct({
  monorepoRootPath: t.union([t.String, t.Nil]),
  webpackConfigModifier: t.union([t.Function, t.Nil]),
  babelConfigModifier: t.union([t.Function, t.Nil]),
});

async function buildConfigFromConfigFile(
  configFile: string
): Promise<MonopackConfig> {
  // $FlowIgnore (The config is dynamically loaded !)
  const config: ConfigFile = require(configFile);
  const result = t.validate(config, ConfigFileTCombType);
  if (!result.isValid()) {
    throw new Error(`Invalid file ${configFile}
      The following errors have been found : ${result.errors.join('\n')}`);
  }

  const { monorepoRootPath } = config;

  return {
    monorepoRootPath: monorepoRootPath
      ? path.resolve(path.dirname(configFile), monorepoRootPath)
      : await lookupMonorepoRoot(configFile),
    webpackConfigModifier: config.babelConfigModifier || identity,
    babelConfigModifier: config.webpackConfigModifier || identity,
  };
}

async function lookupMonorepoRoot(startFile: string): Promise<string> {
  return '';
}

function identity<T>(t: T): T {
  return t;
}
