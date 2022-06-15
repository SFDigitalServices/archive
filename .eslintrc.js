/** @type {import('eslint').ESLint.Options} */
module.exports = {
  plugins: ['sfgov'],
  extends: [
    'plugin:sfgov/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020
  }
}
