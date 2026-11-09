/**
 * Comprueba que API + Vite proxy estén listos para compartir.
 * Uso: node scripts/check-share.mjs
 */
const API = 'http://127.0.0.1:4000/api/health'
const PROXY = 'http://127.0.0.1:5173/api/health'
const EVENTS = 'http://127.0.0.1:5173/api/events'

async function check(url, label) {
  try {
    const res = await fetch(url)
    const text = await res.text()
    const ok = res.ok
    console.log(`${ok ? 'OK ' : 'FAIL'} ${label} → ${res.status} ${text.slice(0, 120)}`)
    return ok
  } catch (err) {
    console.log(`FAIL ${label} → ${err.message}`)
    return false
  }
}

const a = await check(API, 'API :4000')
const b = await check(PROXY, 'Proxy Vite /api/health')
const c = await check(EVENTS, 'Proxy Vite /api/events')

if (a && b && c) {
  console.log('\nListo. En otra terminal: npm run share')
  console.log('Pásale al profesor la URL *.trycloudflare.com')
  process.exit(0)
}

console.log('\nArranca antes:')
if (!a) console.log('  1) Laragon + cd eventos-backend && npm run dev')
if (!b || !c) console.log('  2) cd eventos-frontend && npm run dev')
process.exit(1)
