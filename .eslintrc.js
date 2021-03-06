module.exports = {
  extends: [
    'standard',
    'plugin:flowtype/recommended',
    'prettier',
    'prettier/flowtype',
    'prettier/standard',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/recommended',
    'plugin:promise/recommended',
  ],
  plugins: ['flowtype', 'prettier', 'standard', 'jest', 'import', 'promise'],
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
    'no-unused-expressions': 0,
    'import/unambiguous': 'off',
    'import/no-absolute-path': 'error',
    'import/no-dynamic-require': 'error',
    'import/no-webpack-loader-syntax': 'error',
    'import/no-self-import': 'error',
    'import/no-cycle': 'error',
    'import/export': 'error',
    'import/no-extraneous-dependencies': 'off',
    'import/no-mutable-exports': 'error',
    'import/no-amd': 'error',
    'import/first': 'error',
    'import/no-duplicates': 'error',
    'import/extensions': 'error',
    'import/order': ['error', { 'newlines-between': 'always' }],
    'import/newline-after-import': 'error',
    'import/no-anonymous-default-export': 'error',
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'off',
  },
  globals: {},
};
