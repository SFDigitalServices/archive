/* eslint-disable no-template-curly-in-string */
const { expandEnvVars, unique } = require('../src/utils')

describe('expandEnvVars()', () => {
  const testKey = `TEST_${Date.now().toString(32)}`
  const testValue = 'Hello!'
  const testStrings = [
    [`$${testKey}`, testValue],
    [`\${${testKey}}`, testValue],
    [`\${${testKey}}-foo`, `${testValue}-foo`]
  ]

  it('throws if the input is not a string', () => {
    for (const value of [null, true, {}, []]) {
      expect(() => expandEnvVars(value)).toThrow(/Expected string/)
    }
  })

  it('defaults to process.env', () => {
    process.env[testKey] = testValue
    for (const [input, output] of testStrings) {
      expect(expandEnvVars(input)).toBe(output)
    }
    delete process.env[testKey]
  })

  it('uses custom values if provided', () => {
    const vars = { [testKey]: testValue }
    for (const [input, output] of testStrings) {
      expect(expandEnvVars(input, vars)).toBe(output)
    }
  })

  it('handles undefined vars', () => {
    for (const str of ['foo: $FOO', 'foo: ${FOO}']) {
      expect(expandEnvVars(str, null)).toBe('foo: ')
    }
  })

  it('expands falsy values as an empty string', () => {
    for (const str of ['foo: $FOO', 'foo: ${FOO}']) {
      for (const value of [false, null, undefined]) {
        expect(expandEnvVars(str, { FOO: value })).toBe('foo: ')
      }
    }
  })
})

describe('unique', () => {
  it('works', () => {
    expect(['foo', 'foo', 'bar'].filter(unique)).toEqual(['foo', 'bar'])
  })
})
