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
  +modifyPackageJson: Object => Object,
  +afterBuild: null | (string => void | Promise<void>),
|};

export function getMonopackConfig({
  mainFilePath,
  installPackages,
  extraModules,
  outputDirectory,
}: {|
  +mainFilePath: string,
  +installPackages: boolean | null,
  +extraModules: $ReadOnlyArray<string>,
  +outputDirectory: string | null,
|}): MonopackConfig {
  const directory = path.dirname(mainFilePath);
  const monopackConfigFiles = lookupFilesInParentDirsTopToBottom(
    directory,
    'monopack.config.js'
  );
  if (monopackConfigFiles.length > 0) {
    return buildConfigFromConfigFiles(
      monopackConfigFiles,
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
      modifyPackageJson: identity,
      afterBuild: null,
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
  +modifyPackageJson?: Object => Object,
  +afterBuild?: string => void | Promise<void>,
|};
const ConfigFileTCombType = t.struct({
  monorepoRootPath: t.maybe(t.String),
  outputDirectory: t.maybe(t.String),
  webpackConfigModifier: t.maybe(t.Function),
  babelConfigModifier: t.maybe(t.Function),
  installPackagesAfterBuild: t.maybe(t.Boolean),
  extraModules: t.maybe(t.list(t.String)),
  modifyPackageJson: t.maybe(t.Function),
  afterBuild: t.maybe(t.Function),
});

function buildConfigFromConfigFiles(
  configFiles: string[],
  installPackages: boolean | null,
  extraModules: $ReadOnlyArray<string>,
  outputDirectory: string | null
): MonopackConfig {
  const configs: $ReadOnlyArray<ConfigFile> = configFiles.map(configFile => {
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
    return config;
  });

  const mergedConfig: ConfigFile = configs.reduce((parent, child) => ({
    ...parent,
    ...child,
  }));

  const {
    monorepoRootPath,
    outputDirectory: outputDirectoryFromConfig,
  } = mergedConfig;

  const lastConfigFileDefiningMonorepoRootPath = configFiles.reduce(
    (parent, child, index) => (configs[index].monorepoRootPath ? child : parent)
  );
  const lastConfigFileDefiningOutputDirectory = configFiles.reduce(
    (parent, child, index) => (configs[index].outputDirectory ? child : parent)
  );
  return {
    monorepoRootPath: monorepoRootPath
      ? path.resolve(
          path.dirname(lastConfigFileDefiningMonorepoRootPath),
          monorepoRootPath
        )
      : lookupMonorepoRoot(lastConfigFileDefiningMonorepoRootPath),
    outputDirectory:
      outputDirectory ||
      (outputDirectoryFromConfig
        ? path.resolve(
            path.dirname(lastConfigFileDefiningOutputDirectory),
            outputDirectoryFromConfig
          )
        : null),
    webpackConfigModifier: mergedConfig.webpackConfigModifier || identity,
    babelConfigModifier: mergedConfig.babelConfigModifier || identity,
    installPackagesAfterBuild: (() => {
      if (installPackages !== null) {
        return installPackages;
      } else {
        return mergedConfig.installPackagesAfterBuild !== undefined
          ? mergedConfig.installPackagesAfterBuild
          : true;
      }
    })(),
    extraModules: [
      ...(mergedConfig.extraModules || []),
      ...(extraModules || []),
    ],
    modifyPackageJson: mergedConfig.modifyPackageJson || identity,
    afterBuild: mergedConfig.afterBuild || null,
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

function lookupFilesInParentDirsTopToBottom(
  directory: string,
  filename: string
): string[] {
  const results = [];
  const filePath = path.join(directory, filename);
  if (fs.existsSync(filePath)) {
    results.push(filePath);
  }

  const parentDir = path.resolve(directory, '..');
  if (parentDir === directory) {
    return results;
  } else {
    return [
      ...lookupFilesInParentDirsTopToBottom(parentDir, filename),
      ...results,
    ];
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
