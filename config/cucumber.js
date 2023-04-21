const { TEST_ENV } = process.env

module.exports = {
  default: {
    require: [
      require.resolve('../features/setup')
    ],
    paths: [
      'features/**/*.feature',
      'config/sites/**/*.feature'
    ],
    publishQuiet: true,
    tags: (TEST_ENV === 'production')
      ? 'not @skip'
      : 'not @skip and not @prod-only',
    retryTagFilter: '@flaky',
    retry: 3
  }
}
