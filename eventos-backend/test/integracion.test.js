/**
 * Prácticas 13 y 14. La API real atiende HTTP con la base sustituida,
 * y el cliente móvil traduce un servidor apagado en un error visible.
 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const Module = require('node:module')
const path = require('node:path')
const { after, before, describe, it } = require('node:test')

process.env.JWT_SECRET = 'integracion-test'
process.env.JWT_EXPIRES_IN = '1h'
process.env.BCRYPT_ROUNDS = '4'
process.env.NODE_ENV = 'test'

const dbFile = require.resolve('../src/config/db')
const state = { query: async () => [], ping: async () => true }
const originalLoad = Module._load
Module._load = function (request, parent, isMain) {
  try {
    if (Module._resolveFilename(request, parent, isMain) === dbFile) {
      return {
        query: (...args) => state.query(...args),
        ping: () => state.ping(),
        get pool() {
          return {
            getConnection: async () => {
              throw new Error('pool no usado en estas pruebas')
            },
          }
        },
      }
    }
  } catch {
    // Sigue la carga normal.
  }
  return originalLoad.apply(this, arguments)
}

const app = require('../src/index')
let server
let base

function filaEvento() {
  return {
    id: 4,
    titulo: 'Festival',
    descripcion: 'Música',
    categoria: 'Fiestas',
    categoria_id: 1,
    fecha_inicio: '2026-09-30T21:00:00',
    ubicacion: 'Foro',
    cupos_totales: 10,
    cupos_ocupados: 1,
    imagen_url: null,
    es_destacado: 0,
    es_gratuito: 1,
    estado: 'activo',
  }
}

async function http(ruta, opciones = {}) {
  const respuesta = await fetch(`${base}${ruta}`, {
    method: opciones.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(opciones.headers || {}) },
    body: opciones.body,
  })
  const texto = await respuesta.text()
  let json = null
  try {
    json = JSON.parse(texto)
  } catch {
    json = null
  }
  return { status: respuesta.status, json }
}

before(async () => {
  console.error = () => {}
  server = await new Promise((resolver) => {
    const creado = app.listen(0, '127.0.0.1', () => resolver(creado))
  })
  base = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  if (server) await new Promise((resolver) => server.close(resolver))
})

describe('AUT-04 integración del listado', () => {
  it('GET /api/events responde 200 y solo la página pedida por la app', async () => {
    state.query = async (sql) => (String(sql).includes('FROM eventos') ? [filaEvento()] : [])
    const respuesta = await http('/api/events?limit=50')
    assert.equal(respuesta.status, 200)
    assert.equal(respuesta.json.ok, true)
    assert.equal(respuesta.json.limit, 50)
    assert.equal(respuesta.json.events.length, 1)
    assert.equal(respuesta.json.events[0].title, 'Festival')
    assert.equal(respuesta.json.events[0].spots, 9)
    assert.equal(Object.hasOwn(respuesta.json.events[0], 'password'), false)

    let sqlVisto = ''
    let paramsVistos = null
    state.query = async (sql, params) => {
      sqlVisto = String(sql)
      paramsVistos = params
      return String(sql).includes('FROM eventos') ? [filaEvento()] : []
    }
    const corta = await http('/api/events?q=a')
    assert.equal(corta.status, 200)
    assert.equal(sqlVisto.includes('LIKE'), false)
    const busca = await http(`/api/events?q=${encodeURIComponent('fiesta')}`)
    assert.equal(busca.status, 200)
    assert.match(sqlVisto, /LIKE :q/)
    assert.equal(paramsVistos.q, '%fiesta%')
  })
})

describe('AUT-05 integración del registro', () => {
  const cuerpo = {
    name: 'Ana López',
    email: 'ana.ci@evently.test',
    password: 'secreto',
    confirmPassword: 'secreto',
  }

  it('guarda el hash y no el texto de la contraseña', async () => {
    let guardado = null
    state.query = async (sql, params) => {
      const texto = String(sql)
      if (texto.includes('SELECT id FROM usuarios WHERE email')) return []
      if (texto.includes('INSERT INTO usuarios')) {
        guardado = params
        return { insertId: 15 }
      }
      return [{
        id: 15,
        nombre: 'Ana López',
        email: 'ana.ci@evently.test',
        ciudad: 'Querétaro',
        telefono: '',
        pin_hash: null,
        rol: 'usuario',
      }]
    }

    const respuesta = await http('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(cuerpo),
    })
    assert.equal(respuesta.status, 201)
    assert.equal(respuesta.json.ok, true)
    assert.equal(guardado.email, 'ana.ci@evently.test')
    assert.equal(String(guardado.password_hash).startsWith('$2'), true)
    assert.equal(guardado.password, undefined)
    assert.equal(Object.hasOwn(respuesta.json.user, 'password_hash'), false)
  })

  it('un correo repetido en carrera responde 409 y no 500', async () => {
    state.query = async (sql) => {
      if (String(sql).includes('INSERT INTO usuarios')) {
        const error = new Error('duplicado')
        error.code = 'ER_DUP_ENTRY'
        throw error
      }
      return []
    }
    const respuesta = await http('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(cuerpo),
    })
    assert.equal(respuesta.status, 409)
    assert.equal(respuesta.json.ok, false)
  })
})

describe('AUT-06 persistencia rechazada y servidor apagado', () => {
  it('sin token no abre la sesión y un JSON roto no es un 500', async () => {
    const sesion = await http('/api/auth/me')
    assert.equal(sesion.status, 401)
    assert.equal(sesion.json.code, 'UNAUTHORIZED')

    const roto = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    })
    const json = await roto.json()
    assert.equal(roto.status, 400)
    assert.match(json.error, /JSON/)
  })

  it('el cliente muestra error cuando la instancia no acepta la conexión', async () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../../eventos-mobile/src/api.js'), 'utf8')
    const apoyo = fs
      .readFileSync(path.resolve(__dirname, '../../eventos-mobile/src/resiliencia.js'), 'utf8')
      .replace(/export function /g, 'function ')
      .replace(/export async function /g, 'async function ')
    const inicio = src.indexOf('export async function api')
    const cuerpo = src.slice(inicio).replace('export async function api', 'async function api')
    const api = new Function(
      'getToken',
      'fetch',
      'API_BASE',
      `${apoyo}\n${cuerpo}\nreturn api;`
    )(async () => null, fetch, 'http://127.0.0.1:9')

    const inicioMs = Date.now()
    const resultado = await api('/api/events', { timeoutMs: 300 })
    assert.equal(resultado.ok, false)
    assert.equal(resultado.status, 0)
    assert.equal(resultado.error, 'No se pudo conectar con la instancia.')
    assert.equal(resultado.intentos, 3)
    assert.ok(Date.now() - inicioMs >= 500)
  })
})
