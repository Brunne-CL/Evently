const { EventEmitter } = require('events')

const hub = new EventEmitter()
hub.setMaxListeners(0)

function publish(change) {
  hub.emit('change', change)
}

function subscribe(listener) {
  hub.on('change', listener)
  return () => hub.off('change', listener)
}

module.exports = { publish, subscribe }
