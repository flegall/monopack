// @flow
import fs from 'fs';
import path from 'path';

import _ from 'lodash';
import glob from 'glob-promise';
import webpack from 'webpack';

import { importMatcher } from './importMatcher';

export type MonopackBuilderParams = {
  +monorepoRootPath: string,
  +webpackConfigModifier: Object => Object,
  +babelConfigModifier: Object => Object,
  +mainJs: string,
  +outputDirectory: string,
  +print: string => void,
};

export async function build({
  monorepoRootPath,
  mainJs,
  outputDirectory,
  webpackConfigModifier,
  babelConfigModifier,
  print,
}: MonopackBuilderParams): Promise<void> {
  if (!fs.existsSync(mainJs)) {
    throw new Error(`Compilation failed: ${mainJs} entry file was not found`);
  }

  const monorepoPackages = [
    ...(await collectMonorepoPackages(
      monorepoRootPath,
      'package.json',
      'workspaces'
    )),
    ...(await collectMonorepoPackages(
      monorepoRootPath,
      'lerna.json',
      'packages'
    )),
  ];

  return new Promise((resolve, reject) => {
    const baseBabelConfig = {
      presets: [
        [
          require.resolve('babel-preset-env'),
          {
            targets: {
              node: '6.10',
            },
          },
        ],
      ],
    };
    const modifiedBabelConfig = babelConfigModifier(baseBabelConfig);
    const baseWebPackConfig = {
      entry: mainJs,
      output: {
        path: outputDirectory,
        filename: 'main.js',
      },
      mode: 'production',
      devtool: 'source-map',
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: {
              loader: 'babel-loader',
              options: modifiedBabelConfig || baseBabelConfig,
            },
          },
        ],
      },
      externals: [
        (
          context: string,
          request: string,
          callback: (void | null, string | void) => void
        ) => {
          const importMatch = importMatcher(
            request,
            context,
            mainJs,
            monorepoPackages
          );
          switch (importMatch.type) {
            case 'INLINE': {
              return callback();
            }
            default: {
              // eslint-disable-next-line no-unused-vars
              const typeCheck: 'IMPORT' = importMatch.type;
              return callback(null, 'commonjs ' + request);
            }
          }
        },
      ],
    };
    const modifiedWebPackConfig = webpackConfigModifier(baseWebPackConfig);
    webpack(modifiedWebPackConfig || baseWebPackConfig, (err, stats) => {
      if (err) {
        reject(err);
      }
      if (stats.hasErrors()) {
        reject(new Error('Compilation failed\n' + stats.toString()));
      }
      print(stats.toString() + '\n');
      resolve();
    });
  });
}

async function collectMonorepoPackages(
  monorepoRootPath: string,
  file: string,
  property: string
): Promise<string[]> {
  const packages = [];

  if (fs.existsSync(path.join(monorepoRootPath, file))) {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(monorepoRootPath, file), 'utf-8')
    );
    if (_.isArray(pkg[property])) {
      for (const subPackageGlob of pkg[property]) {
        const subPackagePaths = await glob(subPackageGlob, {
          cwd: monorepoRootPath,
        });
        for (const subPackagePath of subPackagePaths) {
          const subPackageFullPath = path.join(
            monorepoRootPath,
            subPackagePath,
            'package.json'
          );
          const subPackage = JSON.parse(
            fs.readFileSync(subPackageFullPath, 'utf-8')
          );
          packages.push(subPackage.name);
        }
      }
    }
  }

  return packages;
}
