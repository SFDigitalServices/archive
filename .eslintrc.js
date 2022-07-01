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
    'promise/always-return': 0,
    'promise/catch-or-return': 0
  }
}
