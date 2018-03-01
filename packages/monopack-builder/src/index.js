// @flow
import webpack from 'webpack';

export type MonopackBuilderParams = {
  +monorepoRootPath: string,
  +webpackConfigModifier: Object => Object,
  +babelConfigModifier: Object => Object,
  +mainJs: string,
  +outputDirectory: string,
  +println: string => void,
};

export type MonopackBuilderResults = {
  +outputDirectory: string,
};

export function build({
  mainJs,
  outputDirectory,
  webpackConfigModifier,
}: MonopackBuilderParams): Promise<MonopackBuilderResults> {
  return new Promise((resolve, reject) => {
    const baseWebPackConfig = {
      entry: mainJs,
      output: {
        path: outputDirectory,
        filename: 'main.js',
      },
    };
    const modifiedWebPackConfig = webpackConfigModifier(baseWebPackConfig);
    webpack(modifiedWebPackConfig || baseWebPackConfig);
    resolve({ outputDirectory: '' });
  });
}
