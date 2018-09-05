// @flow
import fs from 'fs';
import path from 'path';

import _ from 'lodash';
import t from 'tcomb-validation';

export type MonopackConfig = {|
  +monorepoRootPath: string,
  +outputDirectory: string | null,
  +installPackagesAfterBuild: boolean,
  +webpackConfigModifier: Object => Object,
  +babelConfigModifier: Object => Object,
  +extraModules: $ReadOnlyArray<string>,
|};

export function getMonopackConfig({
  mainFilePath,
  installPackages,
  extraModules,
  outputDirectory,
}: {
  mainFilePath: string,
  installPackages: boolean | null,
  extraModules: $ReadOnlyArray<string>,
  outputDirectory: string | null,
}): MonopackConfig {
  const directory = path.dirname(mainFilePath);
  const monopackConfigFile = lookupFileInParentDirs(
    directory,
    'monopack.config.js'
  );
  if (monopackConfigFile) {
    return buildConfigFromConfigFile(
      monopackConfigFile,
      installPackages,
      extraModules,
      outputDirectory
    );
  } else {
    return {
      monorepoRootPath: lookupMonorepoRoot(mainFilePath),
      outputDirectory: outputDirectory || null,
      webpackConfigModifier: identity,
      babelConfigModifier: identity,
      installPackagesAfterBuild:
        installPackages !== null ? installPackages : true,
      extraModules,
    };
  }
}

type ConfigFile = {|
  +monorepoRootPath?: string,
  +outputDirectory?: string,
  +webpackConfigModifier?: Object => Object,
  +babelConfigModifier?: Object => Object,
  +installPackagesAfterBuild?: boolean,
  +extraModules?: $ReadOnlyArray<string>,
|};
const ConfigFileTCombType = t.struct({
  monorepoRootPath: t.union([t.String, t.Nil]),
  outputDirectory: t.union([t.String, t.Nil]),
  webpackConfigModifier: t.union([t.Function, t.Nil]),
  babelConfigModifier: t.union([t.Function, t.Nil]),
  installPackagesAfterBuild: t.union([t.Boolean, t.Nil]),
  extraModules: t.union([t.list(t.String), t.Nil]),
});

function buildConfigFromConfigFile(
  configFile: string,
  installPackages: boolean | null,
  extraModules: $ReadOnlyArray<string>,
  outputDirectory: string | null
): MonopackConfig {
  const config: ConfigFile = readJsFile(configFile);
  const result = t.validate(config, ConfigFileTCombType, { strict: true });
  if (!result.isValid()) {
    throw new Error(`Invalid file ${configFile}
      The following errors have been found : ${JSON.stringify(
        result.errors,
        null,
        2
      )}`);
  }

  const {
    monorepoRootPath,
    outputDirectory: outputDirectoryFromConfig,
  } = config;

  return {
    monorepoRootPath: monorepoRootPath
      ? path.resolve(path.dirname(configFile), monorepoRootPath)
      : lookupMonorepoRoot(configFile),
    outputDirectory:
      outputDirectory ||
      (outputDirectoryFromConfig
        ? path.resolve(path.dirname(configFile), outputDirectoryFromConfig)
        : null),
    webpackConfigModifier: config.webpackConfigModifier || identity,
    babelConfigModifier: config.babelConfigModifier || identity,
    installPackagesAfterBuild: (() => {
      if (installPackages !== null) {
        return installPackages;
      } else {
        return config.installPackagesAfterBuild !== undefined
          ? config['installPackagesAfterBuild']
          : true;
      }
    })(),
    extraModules: [...(config.extraModules || []), ...(extraModules || [])],
  };
}

function lookupMonorepoRoot(startFile: string): string {
  const directory = path.dirname(startFile);
  const lernaJson = lookupFileInParentDirs(directory, 'lerna.json');
  if (lernaJson) {
    return path.dirname(lernaJson);
  }
  const packageJsonWithWorkspaces = lookupPackageJsonWithWorkspacesInParentsDirs(
    directory
  );
  if (packageJsonWithWorkspaces) {
    return path.dirname(packageJsonWithWorkspaces);
  }

  const topMostPackageJson = lookupTopMostPackageJson(directory);
  if (topMostPackageJson) {
    return path.dirname(topMostPackageJson);
  } else {
    throw new Error(
      `Cannot find any root package.json or lerna.json to determine monorepo root from ${directory}`
    );
  }
}

function lookupFileInParentDirs(directory: string, filename: string): ?string {
  const filePath = path.join(directory, filename);
  if (fs.existsSync(filePath)) {
    return filePath;
  }

  const parentDir = path.resolve(directory, '..');
  if (parentDir === directory) {
    return undefined;
  } else {
    return lookupFileInParentDirs(parentDir, filename);
  }
}

function lookupPackageJsonWithWorkspacesInParentsDirs(directory): ?string {
  const packageJsonPath = lookupFileInParentDirs(directory, 'package.json');
  if (packageJsonPath) {
    const packageJson = readJsonFile(packageJsonPath);
    if (_.isArray(packageJson.workspaces)) {
      return packageJsonPath;
    }
  }

  const parentDir = path.resolve(directory, '..');
  if (parentDir === directory) {
    return undefined;
  } else {
    return lookupPackageJsonWithWorkspacesInParentsDirs(parentDir);
  }
}

function lookupTopMostPackageJson(
  directory: string,
  topMostPackageJsonSoFar: ?string = undefined
): ?string {
  const packageJsonPath = lookupFileInParentDirs(directory, 'package.json');
  if (!packageJsonPath) {
    return topMostPackageJsonSoFar;
  }

  const parentDir = path.resolve(directory, '..');
  if (parentDir === directory) {
    return topMostPackageJsonSoFar;
  } else {
    return lookupTopMostPackageJson(
      parentDir,
      packageJsonPath || topMostPackageJsonSoFar
    );
  }
}

function identity<T>(t: T): T {
  return t;
}

function readJsonFile<T>(path: string): T {
  return JSON.parse(fs.readFileSync(path, 'utf-8'));
}

function readJsFile<T>(path: string): T {
  // $FlowIgnore
  return require(path); // eslint-disable-line import/no-dynamic-require
}
