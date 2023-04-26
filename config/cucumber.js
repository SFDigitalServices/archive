const { TEST_ENV } = process.env

module.exports = {
  /** @type {import('@cucumber/cucumber/lib/api').IConfiguration} */
  default: {
    require: [
      require.resolve('../features/setup')
    ],
    paths: [
      'features/**/*.feature',
      'config/sites/**/*.feature',
      '!**/__template__/**'
    ],
    publishQuiet: true,
    tags: (TEST_ENV === 'production')
      ? 'not @skip'
      : 'not @skip and not @prod-only',
    retryTagFilter: '@flaky',
    retry: 3
  }
}
