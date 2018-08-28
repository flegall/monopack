module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': '<rootDir>/jestPreprocess.js',
  },
};
