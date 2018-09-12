const webPackMerge = require('webpack-merge');
const babelMerge = require('babel-merge');

// Use specific monopack-source mainField in
// package.json as otherwise the distribution
// version will be used
module.exports.webpackConfigModifier = config =>
  webPackMerge(config, {
    resolve: {
      mainFields: ['monopack-source', 'module', 'main'],
    },
  });

// Use current preset to make it use current features
module.exports.babelConfigModifier = config =>
  babelMerge(config, {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            node: 'current',
          },
        },
      ],
    ],
  });
