module.exports = {
  preset: 'ts-jest/presets/default',
  testEnvironment: 'jsdom',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts'
  ],
  transformIgnorePatterns: [
  ]
}