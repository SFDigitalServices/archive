/** @type {import('eslint').Linter.Config} */
module.exports = {
  plugins: ['sfgov'],
  extends: [
    'plugin:sfgov/recommended',
    'plugin:sfgov/node'
  ],
  rules: {
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
