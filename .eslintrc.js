/** @type {import('eslint').Linter.Config} */
module.exports = {
  plugins: [
    'sfgov',
    'unicorn'
  ],
  extends: [
    'plugin:sfgov/recommended',
    'plugin:sfgov/node'
  ],
  rules: {
    'unicorn/prefer-at': 1,
    'unicorn/better-regex': 1,
    'unicorn/no-unsafe-regex': 1
  },
  reportUnusedDisableDirectives: true,
  overrides: [
    {
      files: 'scripts/**/*.js',
      rules: {
        'node/shebang': 0
      }
    }
  ]
}
