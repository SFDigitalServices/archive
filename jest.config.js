/** @type {import('ts-jest').ProjectConfigTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default',
  testEnvironment: 'jsdom',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
}