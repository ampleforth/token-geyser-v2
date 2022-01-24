module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'plugin:react/recommended',
    'airbnb-typescript',
    'prettier', // delegates formatting to prettiers
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  ignorePatterns: ['src/sdk'],
  plugins: ['react', '@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-use-before-define': 'off', // define helper components at bottom of file
    '@typescript-eslint/no-unused-expressions': ['warn', { allowShortCircuit: true }], // allow the f && f() pattern,
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off', // using Typescript's type checking facilities instead
    'react/require-default-props': 'off', // using ES6 default values instead
    'react/jsx-props-no-spreading': 'off', // use this for convenience,
    'import/no-extraneous-dependencies': 'off', // allow dependencies from sdk
    'import/prefer-default-export': 'off',
    'no-plusplus': ['warn', { allowForLoopAfterthoughts: true }],
    // allow logs
    'no-console': 'off',
    'no-alert': 'off',
    // TODO: enable before shipping
    'jsx-a11y/label-has-associated-control': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/no-noninteractive-element-interactions': 'off',
    'jsx-a11y/interactive-supports-focus': 'off',
    'no-else-return': 'off', // seems to be buggy
    'no-await-in-loop': 'off',
    'guard-for-in': 'off',
  },
  settings: {
    'import/resolver': {
      //need this and eslint-import-resolver-typescript for eslint to correctly resolve
      typescript: {},
    },
  },
}
