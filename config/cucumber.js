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
    tags: 'not @skip',
    retryTagFilter: '@flaky',
    retry: 3
  }
}
