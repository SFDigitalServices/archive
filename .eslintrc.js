/** @type {import('eslint').Linter.Config} */
module.exports = {
  plugins: [
    'sfgov',
    'jest',
    'unicorn'
  ],
  extends: [
    'plugin:sfgov/recommended',
    'plugin:sfgov/node'
  ],
  rules: {
    'unicorn/prefer-at': 1,
    'unicorn/better-regex': 1,
    'unicorn/no-unsafe-regex': 1,
    'unicorn/consistent-destructuring': 1,
    'unicorn/no-new-buffer': 1,
    'unicorn/no-await-expression-member': 1,
    'unicorn/no-object-as-default-parameter': 1,
    'unicorn/no-useless-fallback-in-spread': 1,
    'unicorn/no-useless-spread': 1,
    'unicorn/no-useless-undefined': 1,
    'unicorn/prefer-node-protocol': 'warn',
    'unicorn/text-encoding-identifier-case': 1,
    'unicorn/prefer-string-slice': 1
  },
  reportUnusedDisableDirectives: true,
  overrides: [
    {
      files: 'scripts/**/*.{js,mjs}',
      rules: {
        'node/shebang': 0
      }
    },
    {
      files: '__tests__/**/*.js',
      env: {
        jest: true
      }
    }
  ]
}
