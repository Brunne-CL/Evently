/**
 * Práctica 11 — pruebas white box de Evently.
 * Ejecuta rutas internas de validación, cálculo y persistencia
 * con la base de datos sustituida, para medir cobertura del código real.
 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const Module = require('node:module')
const path = require('node:path')
const { describe, it, before } = require('node:test')

process.env.JWT_SECRET = 'whitebox-test-secret'
process.env.JWT_EXPIRES_IN = '1h'
process.env.BCRYPT_ROUNDS = '4'

const dbFile = require.resolve('../src/config/db')
const state = {
  query: async () => [],
  getConnection: async () => {
    throw new Error('getConnection no configurado')
  },
}

const originalLoad = Module._load
Module._load = function (request, parent, isMain) {
  try {
    if (Module._resolveFilename(request, parent, isMain) === dbFile) {
      return {
        query: (...args) => state.query(...args),
        ping: async () => true,
        get pool() {
          return { getConnection: () => state.getConnection() }
        },
      }
    }
  } catch {
    // El módulo aún no existe; sigue la carga normal.
  }
  return originalLoad.apply(this, arguments)
}

const { isValidPin, hashPassword, verifyPassword } = require('../src/utils/password')
const auth = require('../src/controllers/authController')
const events = require('../src/controllers/eventsController')
const support = require('../src/controllers/supportController')
const { requireAuth } = require('../src/middleware/auth')
const { signAccessToken, revokeAccessToken } = require('../src/utils/tokens')

const casos = []

function anotar(id, metodo, entrada, esperado, obtenido) {
  const ok = Object.is(esperado, obtenido) || JSON.stringify(esperado) === JSON.stringify(obtenido)
  casos.push({ id, metodo, entrada, esperado, obtenido, ok })
  assert.equal(ok, true, `${id} ${metodo}: esperado ${JSON.stringify(esperado)} obtuvo ${JSON.stringify(obtenido)}`)
}

function http() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }
}

function complejidad(fn) {
  const src = fn.toString()
  const puntos = src.match(/\bif\b|\bfor\b|\bwhile\b|\bcase\b|\bcatch\b|&&|\|\||\?(?![.=])/g) || []
  return 1 + puntos.length
}

function extraerFuncion(archivo, nombre) {
  const src = fs.readFileSync(archivo, 'utf8')
  const inicio = src.indexOf(`export function ${nombre}`)
  const fin = src.indexOf('\nexport ', inicio + 10)
  const cuerpo = src.slice(inicio, fin).replace('export ', '')
  return new Function(`${cuerpo}\nreturn ${nombre};`)()
}

const apiMovil = path.resolve(__dirname, '../../eventos-mobile/src/api.js')
const parseQrCode = extraerFuncion(apiMovil, 'parseQrCode')

before(() => {
  console.error = () => {}
})

describe('isValidPin — validación', () => {
  const matriz = [
    ['PIN-01', null, false],
    ['PIN-02', undefined, false],
    ['PIN-03', 1234, false],
    ['PIN-04', '', false],
    ['PIN-05', '123', false],
    ['PIN-06', '1234', true],
    ['PIN-07', '123456', true],
    ['PIN-08', '1234567', false],
    ['PIN-09', '12a4', false],
    ['PIN-10', ' 1234', false],
  ]
  for (const [id, entrada, esperado] of matriz) {
    it(`${id} ${JSON.stringify(entrada)}`, () => {
      anotar(id, 'isValidPin', entrada, esperado, isValidPin(entrada))
    })
  }
})

describe('verifyPassword — condiciones y excepción de entrada', () => {
  it('rechaza texto vacío o hash vacío sin llamar a bcrypt', async () => {
    anotar('PWD-01', 'verifyPassword', 'plain vacío', false, await verifyPassword('', '$2a$04$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'))
    anotar('PWD-02', 'verifyPassword', 'hash vacío', false, await verifyPassword('secreto', ''))
    anotar('PWD-03', 'verifyPassword', 'ambos vacíos', false, await verifyPassword('', ''))
  })

  it('compara un hash real y una clave distinta', async () => {
    const hash = await hashPassword('clave-ok')
    anotar('PWD-04', 'verifyPassword', 'clave correcta', true, await verifyPassword('clave-ok', hash))
    anotar('PWD-05', 'verifyPassword', 'clave distinta', false, await verifyPassword('clave-no', hash))
    assert.equal(hash.startsWith('$2'), true)
  })
})

describe('parseQrCode — caminos del cliente móvil', () => {
  const codigo = 'a'.repeat(24)
  const matriz = [
    ['QR-01', '', ''],
    ['QR-02', null, ''],
    ['QR-03', `https://evently.test/abrir?qr=${codigo}`, codigo],
    ['QR-04', `evently://abrir&qr=${codigo}`, codigo],
    ['QR-05', `http://e.test/?qr=${'a'.repeat(19)}%5F`, `${'a'.repeat(19)}_`],
    ['QR-06', `evently://qr=${codigo}`, codigo],
    ['QR-07', codigo, codigo],
    ['QR-08', 'no-es-codigo', ''],
    ['QR-09', 'http://[', ''],
  ]
  for (const [id, entrada, esperado] of matriz) {
    it(id, () => {
      anotar(id, 'parseQrCode', entrada, esperado, parseQrCode(entrada))
    })
  }
})

describe('serializeEvent — cálculo de cupos', () => {
  function fila(ocupados, totales) {
    return {
      id: 7,
      titulo: 'Ensayo',
      descripcion: 'd',
      categoria: 'Fiestas',
      categoria_id: 1,
      fecha_inicio: '2026-09-30T21:00:00',
      ubicacion: 'Foro',
      cupos_totales: totales,
      cupos_ocupados: ocupados,
      imagen_url: null,
      es_destacado: 1,
      es_gratuito: 0,
      estado: 'activo',
    }
  }

  async function cupos(ocupados, totales) {
    state.query = async (sql) => {
      if (String(sql).includes('FROM eventos')) return [fila(ocupados, totales)]
      return []
    }
    const res = http()
    await events.listEvents({ query: {} }, res)
    return res.body.events[0]
  }

  it('resta ocupados y no deja cupo negativo', async () => {
    const libre = await cupos(3, 10)
    anotar('CUP-01', 'serializeEvent', '10-3', 7, libre.spots)
    const lleno = await cupos(12, 10)
    anotar('CUP-02', 'serializeEvent', '10-12', 0, lleno.spots)
    const justo = await cupos(10, 10)
    anotar('CUP-03', 'serializeEvent', '10-10', 0, justo.spots)
    anotar('CUP-04', 'serializeEvent', 'destacado', true, libre.featured)
    anotar('CUP-05', 'serializeEvent', 'gratuito', false, libre.free)
    assert.equal(Object.hasOwn(libre, 'password'), false)
  })
})

describe('register — decisiones de validación', () => {
  const base = {
    name: 'Ana López',
    email: 'ana.whitebox@evently.test',
    password: 'secreto',
    confirmPassword: 'secreto',
  }

  async function registrar(body, query) {
    state.query = query || (async () => [])
    const res = http()
    await auth.register({ body }, res)
    return res
  }

  it('rechaza nombre, correo, contraseña, PIN y teléfono en el límite', async () => {
    anotar('REG-01', 'register', 'sin nombre', 400, (await registrar({})).statusCode)
    anotar('REG-02', 'register', 'nombre de 1', 400, (await registrar({ ...base, name: 'A' })).statusCode)
    anotar('REG-03', 'register', 'correo inválido', 400, (await registrar({ ...base, email: 'ana' })).statusCode)
    anotar('REG-04', 'register', 'contraseña de 5', 400, (await registrar({ ...base, password: '12345', confirmPassword: '12345' })).statusCode)
    anotar('REG-05', 'register', 'confirmación distinta', 400, (await registrar({ ...base, confirmPassword: 'otra' })).statusCode)
    anotar('REG-06', 'register', 'PIN de 3', 400, (await registrar({ ...base, pin: '123', telefono: '4421234567' })).statusCode)
    anotar('REG-07', 'register', 'PIN de 7', 400, (await registrar({ ...base, pin: '1234567', telefono: '4421234567' })).statusCode)
    anotar('REG-08', 'register', 'PIN sin teléfono', 400, (await registrar({ ...base, pin: '1234', telefono: '123' })).statusCode)
    anotar('REG-09', 'register', 'teléfono de 6 dígitos', 400, (await registrar({ ...base, telefono: '123456' })).statusCode)
  })

  it('crea la cuenta, oculta el hash y traduce el correo duplicado', async () => {
    const creado = await registrar(
      { ...base, pin: '1234', telefono: '442-123-4567' },
      async (sql) => {
        if (String(sql).includes('SELECT id FROM usuarios')) return []
        if (String(sql).includes('INSERT INTO usuarios')) return { insertId: 42 }
        return [{
          id: 42,
          nombre: 'Ana López',
          email: 'ana.whitebox@evently.test',
          ciudad: 'Querétaro',
          telefono: '442-123-4567',
          pin_hash: 'hash',
          rol: 'usuario',
        }]
      }
    )
    anotar('REG-10', 'register', 'válido', 201, creado.statusCode)
    anotar('REG-11', 'register', 'ok', true, creado.body.ok)
    anotar('REG-12', 'register', 'sin password_hash', false, Object.hasOwn(creado.body.user, 'password_hash'))
    anotar('REG-13', 'register', 'sin pin_hash', false, Object.hasOwn(creado.body.user, 'pin_hash'))
    anotar('REG-14', 'register', 'hasPin', true, creado.body.user.hasPin)

    const duplicado = await registrar(base, async () => [{ id: 9 }])
    anotar('REG-15', 'register', 'correo repetido', 409, duplicado.statusCode)

    const carrera = await registrar(base, async (sql) => {
      if (String(sql).includes('INSERT')) {
        const err = new Error('Duplicate')
        err.code = 'ER_DUP_ENTRY'
        throw err
      }
      return []
    })
    anotar('REG-16', 'register', 'carrera UNIQUE', 409, carrera.statusCode)
  })
})

describe('login y requireAuth — 401 frente a 403', () => {
  const usuario = {
    id: 3,
    nombre: 'Ana',
    email: 'ana.whitebox@evently.test',
    ciudad: 'Querétaro',
    telefono: '',
    pin_hash: null,
    rol: 'usuario',
    activo: 1,
    password_hash: null,
  }

  before(async () => {
    usuario.password_hash = await hashPassword('secreto')
  })

  it('separa credencial inválida, cuenta inactiva y sesión ausente', async () => {
    state.query = async () => []
    let res = http()
    await auth.login({ body: { email: 'no', password: 'x' } }, res)
    anotar('LOG-01', 'login', 'correo mal formado', 400, res.statusCode)

    res = http()
    await auth.login({ body: { email: 'ana.whitebox@evently.test' } }, res)
    anotar('LOG-02', 'login', 'sin contraseña', 400, res.statusCode)

    res = http()
    await auth.login({ body: { email: 'ana.whitebox@evently.test', password: 'secreto' } }, res)
    anotar('LOG-03', 'login', 'usuario inexistente', 401, res.statusCode)

    state.query = async (sql) => {
      if (String(sql).includes('UPDATE')) return { affectedRows: 1 }
      return [{ ...usuario, activo: 0 }]
    }
    res = http()
    await auth.login({ body: { email: 'ana.whitebox@evently.test', password: 'secreto' } }, res)
    anotar('LOG-04', 'login', 'cuenta inactiva', 403, res.statusCode)

    state.query = async (sql) => {
      if (String(sql).includes('UPDATE')) return { affectedRows: 1 }
      return [usuario]
    }
    res = http()
    await auth.login({ body: { email: 'ana.whitebox@evently.test', password: 'mala' } }, res)
    anotar('LOG-05', 'login', 'contraseña mala', 401, res.statusCode)

    res = http()
    await auth.login({ body: { email: 'Ana.Whitebox@evently.test', password: 'secreto' } }, res)
    anotar('LOG-06', 'login', 'éxito', 200, res.statusCode)
    anotar('LOG-07', 'login', 'sin hash en el cuerpo', false, JSON.stringify(res.body).includes('password_hash'))

    const token = res.body.token
    const guard = http()
    let nextCalled = false
    await requireAuth({ headers: {}, user: null }, guard, () => {
      nextCalled = true
    })
    anotar('AUTH-01', 'requireAuth', 'sin encabezado', 401, guard.statusCode)

    const malo = http()
    await requireAuth({ headers: { authorization: 'Bearer no-es-jwt' } }, malo, () => {})
    anotar('AUTH-02', 'requireAuth', 'token inválido', 401, malo.statusCode)

    await revokeAccessToken(require('jsonwebtoken').verify(token, process.env.JWT_SECRET))
    const revocado = http()
    await requireAuth({ headers: { authorization: `Bearer ${token}` } }, revocado, () => {})
    anotar('AUTH-03', 'requireAuth', 'token revocado', 401, revocado.statusCode)

    const fresco = signAccessToken({ id: 3, email: usuario.email, name: usuario.nombre })
    state.query = async () => []
    const baja = http()
    await requireAuth({ headers: { authorization: `Bearer ${fresco}` } }, baja, () => {})
    anotar('AUTH-04', 'requireAuth', 'usuario inactivo o ausente', 401, baja.statusCode)

    state.query = async () => {
      throw new Error('db')
    }
    const caido = http()
    await requireAuth({ headers: { authorization: `Bearer ${fresco}` } }, caido, () => {})
    anotar('AUTH-05', 'requireAuth', 'fallo de base', 500, caido.statusCode)

    state.query = async () => [{ activo: 1 }]
    const ok = http()
    await requireAuth({ headers: { authorization: `Bearer ${fresco}` } }, ok, () => {
      nextCalled = true
    })
    anotar('AUTH-06', 'requireAuth', 'sesión vigente', true, nextCalled)
  })
})

describe('reserveEvent — comunicación con la base', () => {
  function conexion(filas) {
    const conn = {
      committed: false,
      rolled: false,
      released: false,
      async beginTransaction() {},
      async commit() {
        this.committed = true
      },
      async rollback() {
        this.rolled = true
      },
      release() {
        this.released = true
      },
      async execute(sql) {
        const texto = String(sql)
        if (texto.includes('FROM eventos')) return [filas.eventos]
        if (texto.includes('FROM reservas') || texto.includes('FROM reservas'.toLowerCase())) return [filas.reservas]
        if (texto.includes('SELECT id, estado FROM reservas')) return [filas.reservas]
        if (texto.includes('UPDATE reservas') || texto.includes('INSERT INTO reservas') || texto.includes('UPDATE eventos')) {
          return [{ affectedRows: 1 }]
        }
        return [filas.reservas]
      },
    }
    return conn
  }

  async function reservar(id, filas, romper) {
    const conn = conexion(filas)
    if (romper) {
      conn.execute = async () => {
        throw new Error('deadlock')
      }
    }
    state.getConnection = async () => conn
    const res = http()
    await events.reserveEvent({ params: { id }, user: { id: 3 } }, res)
    return { res, conn }
  }

  it('cubre evento inválido, ausente, repetido, lleno, alta y fallo', async () => {
    const invalido = await reservar('0', { eventos: [], reservas: [] })
    anotar('RSV-01', 'reserveEvent', 'id 0', 400, invalido.res.statusCode)

    const ausente = await reservar('9', { eventos: [], reservas: [] })
    anotar('RSV-02', 'reserveEvent', 'inexistente', 404, ausente.res.statusCode)
    anotar('RSV-03', 'reserveEvent', 'rollback', true, ausente.conn.rolled)
    anotar('RSV-04', 'reserveEvent', 'release', true, ausente.conn.released)

    const repetida = await reservar('9', {
      eventos: [{ id: 9, cupos_totales: 10, cupos_ocupados: 1, estado: 'activo' }],
      reservas: [{ id: 4, estado: 'confirmada' }],
    })
    anotar('RSV-05', 'reserveEvent', 'ya confirmada', 200, repetida.res.statusCode)
    anotar('RSV-06', 'reserveEvent', 'mensaje', 'Tu asistencia ya estaba confirmada.', repetida.res.body.message)

    const lleno = await reservar('9', {
      eventos: [{ id: 9, cupos_totales: 10, cupos_ocupados: 10, estado: 'activo' }],
      reservas: [],
    })
    anotar('RSV-07', 'reserveEvent', 'sin cupo', 409, lleno.res.statusCode)

    const alta = await reservar('9', {
      eventos: [{ id: 9, cupos_totales: 10, cupos_ocupados: 4, estado: 'activo' }],
      reservas: [],
    })
    anotar('RSV-08', 'reserveEvent', 'creada', 201, alta.res.statusCode)
    anotar('RSV-09', 'reserveEvent', 'cupos restantes', 5, alta.res.body.spots)
    anotar('RSV-10', 'reserveEvent', 'commit', true, alta.conn.committed)

    const reactivar = await reservar('9', {
      eventos: [{ id: 9, cupos_totales: 10, cupos_ocupados: 4, estado: 'activo' }],
      reservas: [{ id: 4, estado: 'cancelada' }],
    })
    anotar('RSV-11', 'reserveEvent', 'reactivada', 201, reactivar.res.statusCode)

    const fallo = await reservar('9', { eventos: [], reservas: [] }, true)
    anotar('RSV-12', 'reserveEvent', 'excepción', 500, fallo.res.statusCode)
    anotar('RSV-13', 'reserveEvent', 'rollback tras excepción', true, fallo.conn.rolled)
  })
})

describe('support.createTicket — límites del mensaje', () => {
  const valido = {
    name: 'Ana',
    email: 'ana.whitebox@evently.test',
    subject: 'Falla',
    message: 'No puedo ver mis eventos.',
  }

  it('aplica mínimos y máximos antes de insertar', async () => {
    state.query = async () => ({ insertId: 8 })
    const corto = http()
    await support.createTicket({ body: { ...valido, message: '123456789' }, user: null }, corto)
    anotar('SUP-01', 'createTicket', 'mensaje de 9', 400, corto.statusCode)

    const justo = http()
    await support.createTicket({ body: { ...valido, message: '1234567890' }, user: null }, justo)
    anotar('SUP-02', 'createTicket', 'mensaje de 10', 201, justo.statusCode)

    const largo = http()
    await support.createTicket({ body: { ...valido, message: 'x'.repeat(2001) }, user: null }, largo)
    anotar('SUP-03', 'createTicket', 'mensaje de 2001', 400, largo.statusCode)

    state.query = async () => {
      throw new Error('db')
    }
    const caido = http()
    await support.createTicket({ body: valido, user: null }, caido)
    anotar('SUP-04', 'createTicket', 'excepción', 500, caido.statusCode)
  })
})

describe('api() del móvil — red, JSON y error', () => {
  const src = fs.readFileSync(apiMovil, 'utf8')
  const apoyo = fs
    .readFileSync(path.resolve(__dirname, '../../eventos-mobile/src/resiliencia.js'), 'utf8')
    .replace(/export function /g, 'function ')
    .replace(/export async function /g, 'async function ')
  const inicio = src.indexOf('export async function api')
  const cuerpo = src.slice(inicio).replace('export ', '')
  const api = new Function(
    'getToken',
    'fetch',
    'API_BASE',
    `${apoyo}\n${cuerpo}\nreturn api;`
  )

  async function llamar(opciones) {
    const fetchMock = opciones.fetch || (async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, events: [] }),
    }))
    const fn = api(async () => opciones.token || null, fetchMock, opciones.base || 'http://instancia')
    return fn(opciones.path || '/api/events', opciones.args || {})
  }

  it('no presenta un fallo de red como éxito', async () => {
    const caido = await llamar({
      fetch: async () => {
        throw new Error('network down')
      },
    })
    anotar('API-01', 'api', 'sin red', false, caido.ok)
    anotar('API-02', 'api', 'mensaje de red', 'No se pudo conectar con la instancia.', caido.error)

    const invalido = await llamar({
      fetch: async () => ({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('no json')
        },
      }),
    })
    anotar('API-03', 'api', 'JSON inválido', 'Respuesta inválida del servidor.', invalido.error)

    const denegado = await llamar({
      args: { auth: true },
      token: 'abc',
      fetch: async (_url, init) => {
        assert.equal(init.headers.Authorization, 'Bearer abc')
        return {
          ok: false,
          status: 401,
          json: async () => ({ error: 'No autenticado. Inicia sesión para continuar.' }),
        }
      },
    })
    anotar('API-04', 'api', '401', false, denegado.ok)
    anotar('API-05', 'api', 'status', 401, denegado.status)

    const ok = await llamar({ args: { method: 'POST', body: { a: 1 } } })
    anotar('API-06', 'api', 'éxito', true, ok.ok)
  })
})

describe('complejidad ciclomática', () => {
  it('registra el conteo con la regla de ESLint', () => {
    const metodos = [
      ['isValidPin', isValidPin],
      ['verifyPassword', verifyPassword],
      ['parseQrCode', parseQrCode],
      ['register', auth.register],
      ['login', auth.login],
      ['reserveEvent', events.reserveEvent],
      ['listEvents', events.listEvents],
      ['requireAuth', requireAuth],
      ['createTicket', support.createTicket],
    ].map(([nombre, fn]) => ({ metodo: nombre, complejidad: complejidad(fn) }))
    metodos.sort((a, b) => b.complejidad - a.complejidad)
    fs.mkdirSync(path.resolve(__dirname, '../../informe/evidencia-whitebox'), { recursive: true })
    const salida = {
      fecha: new Date().toISOString(),
      regla: 'CC = 1 + if + for + while + case + catch + && + || + ternario',
      metodos,
      casos,
      fallos: casos.filter((c) => !c.ok).length,
    }
    fs.writeFileSync(
      path.resolve(__dirname, '../../informe/evidencia-whitebox/unitarios.json'),
      JSON.stringify(salida, null, 2)
    )
    assert.equal(casos.every((c) => c.ok), true)
    assert.ok(metodos[0].complejidad >= metodos.at(-1).complejidad)
  })
})
