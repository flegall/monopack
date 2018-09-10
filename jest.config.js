module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': '<rootDir>/jestPreprocess.js',
  },
  testRegex: '((\\.|/)(test|spec))\\.jsx?$',
  moduleNameMapper: {
    '^(monopack-[^/]*)': '<rootDir>/packages/$1/src',
  },
  collectCoverageFrom: [
    '**/src/**/*.js',
    '!**/__tests__/**/*.js',
    '!**/node_modules/**/*.js',
  ],
};
