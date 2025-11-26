module.exports = {
  extends: [
    'plugin:node/recommended',
    '@msi-calipsa/eslint-config',
  ],

  env: {
    browser: false,
    node: true,
    es6: false,
    es2023: true,
  },

  parserOptions: {
    sourceType: 'module',
  },

  rules: {
    'object-property-newline': [2, {
      allowAllPropertiesOnSameLine: false,
    }],
    'import/no-unresolved': [
      'error',
      {
        ignore: ['is-relative-uri'],
      },
    ],
    'no-restricted-globals': [
      'error',
      {
        name: 'isFinite',
        message:
          'Use Number.isFinite instead https://github.com/airbnb/javascript#standard-library--isfinite',
      },
      {
        name: 'isNaN',
        message:
          'Use Number.isNaN instead https://github.com/airbnb/javascript#standard-library--isnan',
      },
    ],
    'eslint-comments/no-use': [
      'error',
      {
        allow: [
          'eslint',
          'eslint-disable-next-line',
        ],
      },
    ],
    'no-unused-vars': [
      'error',
      {
        args: 'after-used',
      },
    ],
    'brace-style': [
      'warn',
      'stroustrup',
    ],
    'no-underscore-dangle': [
      'error',
      {
        allow: ['_getJSONData'],
      },
    ],
    'node/no-unpublished-import': [
      'error',
      {
        allowModules: [
          'node-mocks-http',
          '@testcontainers/postgresql',
          '@jest/globals',
          'is-url',
          'is-relative-uri',
        ],
      },
    ],
    'node/no-missing-import': [
      'error',
      {
        allowModules: [
          'is-relative-uri',
        ],
      },
    ],
    'import/extensions': 0,
    'node/no-unsupported-features/es-syntax': 0,
    'no-console': 1,
    'no-return-await': 0,
    'node/no-process-env': 2,
    'node/no-process-exit': 2,
    'sonarjs/prefer-immediate-return': 0,
    'inker/no-same-line-for-elements': 0,
    'import/prefer-default-export': 0,
    strict: [2, 'global'],
    'linebreak-style': 0,
    // unicorn/no-new-array conflicts with unicorn/new-for-builtins
    // which doesn't make a ton of sense.
    'unicorn/no-new-array': 0,
  },
}
