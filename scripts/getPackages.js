/**
 * Very inspired from https://github.com/facebook/jest/blob/master/scripts/getPackages.js
 * @flow
 */

const fs = require('fs');
const path = require('path');

const PACKAGES_DIR = path.resolve(__dirname, '../packages');

// Get absolute paths of all directories under packages/*
module.exports = function getPackages() {
  return fs
    .readdirSync(PACKAGES_DIR)
    .map(file => path.resolve(PACKAGES_DIR, file))
    .filter(f => fs.lstatSync(path.resolve(f)).isDirectory());
};
