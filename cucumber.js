module.exports = {
  default: {
    require: [
      './src/steps.js'
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
