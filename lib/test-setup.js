const expect = require('expect')
const { REDIRECT_PERMANENT } = require('../src/constants')

expect.extend({
  /**
   *
   * @param {import('node-fetch').Response} res
   * @param {string} url
   * @param {number?} expectedStatus
   */
  toBeFetchRedirect (res, url, expectedStatus = REDIRECT_PERMANENT) {
    return matchRedirect({
      status: res.statusCode,
      location: res.headers.get('location')
    }, url, expectedStatus)
  },

  /**
   *
   * @param {import('supertest').Response} res
   * @param {string} url
   * @param {number?} expectedStatus
   */
  toBeSupertestRedirect (res, url, expectedStatus = REDIRECT_PERMANENT) {
    return matchRedirect({
      status: res.statusCode,
      location: res.headers.location
    }, url, expectedStatus)
  }
})

/**
 * @param {{ status: number, location: string }} res
 * @param {string} expectedLocation
 * @param {number} expectedStatus
 * @returns {{ pass: boolean, message: () => string }}
 */
function matchRedirect ({ status, location }, expectedLocation, expectedStatus = REDIRECT_PERMANENT) {
  const matchesStatus = status === expectedStatus
  const matchesLocation = location === expectedLocation
  return {
    pass: matchesStatus && matchesLocation,
    message: () => {
      return matchesStatus
        ? `Expected location "${expectedLocation}", but got "${location}"`
        : `Expected ${expectedStatus}, but got ${status}`
    }
  }
}
