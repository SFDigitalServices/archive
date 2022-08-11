/** @type {import('jest').Config} */
module.exports = {
  collectCoverage: true,
  coverageThreshold: {
    global: {
      lines: 100
    }
  },
  setupFiles: [
    './lib/test-setup.js'
  ]
}
