const { Signale } = require('signales')

const {
  LOG_LEVEL = 'info',
  NODE_ENV
} = process.env

module.exports = new Signale({
  logLevel: LOG_LEVEL,
  disabled: NODE_ENV === 'test' && LOG_LEVEL !== 'debug',
  types: {
    config: {
      badge: '⚙️',
      color: 'yellow',
      label: 'config',
      logLevel: 'info'
    },
    info: {
      badge: '',
      color: 'white'
    },
    site: {
      badge: '📁',
      color: 'magenta',
      label: 'site',
      logLevel: 'info'
    }
  }
})
