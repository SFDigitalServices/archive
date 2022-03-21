/** @type {import('ts-jest').ProjectConfigTsJest} */
const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
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

export default config
