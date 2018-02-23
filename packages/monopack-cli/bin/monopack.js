#!/usr/bin/env node
/**
 * @flow
 */

const importLocal = require('import-local');

if (!importLocal(__filename)) {
  require('../build/cli').run();
}
