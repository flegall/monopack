module.exports = {
  extends: [
    'standard',
    'plugin:flowtype/recommended',
    'plugin:react/recommended',
    'prettier',
    'prettier/flowtype',
    'prettier/standard',
  ],
  plugins: ['flowtype', 'prettier', 'standard', 'jest'],
  parserOptions: {
    sourceType: 'module',
    ecmaFeatures: {},
  },
  env: {
    es6: true,
    node: true,
    'jest/globals': true,
  },
  rules: {
    'prettier/prettier': 'error',
  },
  globals: {},
};
