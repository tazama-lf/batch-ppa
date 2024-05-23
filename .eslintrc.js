// SPDX-License-Identifier: Apache-2.0

module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  plugins: ['@typescript-eslint', 'prettier'],
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'standard-with-typescript',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    project: ['./tsconfig.json'],
    sourceType: 'module', // Allows for the use of imports
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    'no-extend-native': [2, { exceptions: ['String'] }],
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/prefer-optional-chain': 'off',
  },
};
