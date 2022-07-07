module.exports = {
  default: {
    require: [
      './features/setup.js'
    ],
    paths: [
      'features/**/*.feature',
      'sites/**/*.feature'
    ],
    publishQuiet: true,
    tags: 'not @skip',
    retryTagFilter: '@flaky',
    retry: 3
  }
}
