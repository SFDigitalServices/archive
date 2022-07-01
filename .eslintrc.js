/** @type {import('eslint').Linter.Config} */
module.exports = {
  plugins: ['sfgov'],
  extends: ['plugin:sfgov/recommended'],
  parserOptions: {
    ecmaVersion: 2020
  },
  env: {
    node: true
  },
  rules: {
    'promise/catch-or-return': null
  }
}
