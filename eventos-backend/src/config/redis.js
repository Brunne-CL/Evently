const { createClient } = require('redis')

let client = null
let ready = false

function getRedis() {
  return ready ? client : null
}

async function initRedis() {
  const url = (process.env.REDIS_URL || '').trim()
  if (!url) return null

  client = createClient({ url })
  client.on('error', (err) => {
    console.error('[redis]', err.message)
  })

  let lastError = null
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try {
      if (!client.isOpen) await client.connect()
      await client.ping()
      ready = true
      console.log('Redis conectado')
      return client
    } catch (err) {
      lastError = err
      console.error(`[redis] intento ${attempt}/20: ${err.message}`)
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }
  }

  throw lastError
}

module.exports = { initRedis, getRedis }
