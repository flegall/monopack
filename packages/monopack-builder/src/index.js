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

export function build({
  mainJs,
  outputDirectory,
  webpackConfigModifier,
  println,
}: MonopackBuilderParams): Promise<void> {
  return new Promise((resolve, reject) => {
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
              options: {
                presets: [
                  [
                    require.resolve('babel-preset-env'),
                    {
                      targets: {
                        node: '6.10',
                      },
                      modules: false,
                    },
                  ],
                ],
              },
            },
          },
        ],
      },
    };
    const modifiedWebPackConfig = webpackConfigModifier(baseWebPackConfig);
    webpack(modifiedWebPackConfig || baseWebPackConfig, (err, stats) => {
      if (err) {
        reject(err);
      }
      if (stats.hasErrors()) {
        reject(new Error('Compilation failed' + stats.toString()));
      }
      println(stats.toString());
      resolve();
    });
  });
}
