const fs = require('fs');
const path = require('path');

const babelOptions = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '.babelrc'), 'utf8')
);

module.exports = require('babel-jest').createTransformer(babelOptions);
