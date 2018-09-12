const fs = require('fs');
const path = require('path');

const babelMerge = require('babel-merge');

const defaultBabelOptions = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '.babelrc'), 'utf8')
);

// Use current nodejs features for running tests
// This way we ensure that code gets tested on various nodejs versions.
const babelOptions = babelMerge(defaultBabelOptions, {
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

module.exports = require('babel-jest').createTransformer(babelOptions);
