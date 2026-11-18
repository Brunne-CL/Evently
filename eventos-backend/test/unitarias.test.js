/**
 * Prácticas 13 y 14. Pruebas unitarias de la lógica que ya falló:
 * el PIN, el reintento de lecturas y la pantalla que no debe pisarse.
 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { describe, it } = require('node:test')
const { isValidPin } = require('../src/utils/password')

const apoyo = fs
  .readFileSync(path.resolve(__dirname, '../../eventos-mobile/src/resiliencia.js'), 'utf8')
  .replace(/export function /g, 'function ')
  .replace(/export async function /g, 'async function ')
const { esperaReintento, consultarConReintento, crearGuardia } = new Function(
  `${apoyo}\nreturn { esperaReintento, consultarConReintento, crearGuardia };`
)()

describe('AUT-01 PIN válido', () => {
  it('acepta cuatro dígitos', () => {
    assert.equal(isValidPin('1234'), true)
  })
})

describe('AUT-02 PIN vacío o nulo', () => {
  it('rechaza null, undefined y cadena vacía', () => {
    assert.equal(isValidPin(null), false)
    assert.equal(isValidPin(undefined), false)
    assert.equal(isValidPin(''), false)
  })
})

describe('AUT-03 PIN fuera de rango', () => {
  it('rechaza 3 y 7 caracteres, y un valor que no es texto', () => {
    assert.equal(isValidPin('123'), false)
    assert.equal(isValidPin('1234567'), false)
    assert.equal(isValidPin(1234), false)
  })
})

describe('AUT-04 reintento con espera progresiva', () => {
  it('espera 200, 400 y 800 ms y no pasa de 1600', () => {
    assert.deepEqual([0, 1, 2, 3].map(esperaReintento), [200, 400, 800, 1600])
  })

  it('repite una lectura caída y no repite un 400', async () => {
    let lecturas = 0
    const lectura = await consultarConReintento(async () => {
      lecturas += 1
      if (lecturas < 3) return { ok: false, status: 0, error: 'corte' }
      return { ok: true, status: 200 }
    }, { dormir: async () => {} })
    assert.equal(lectura.ok, true)
    assert.equal(lectura.intentos, 3)
    assert.deepEqual(lectura.esperas, [200, 400])

    let escrituras = 0
    const rechazo = await consultarConReintento(async () => {
      escrituras += 1
      return { ok: false, status: 400, error: 'dato inválido' }
    }, { dormir: async () => {} })
    assert.equal(rechazo.intentos, 1)
    assert.equal(escrituras, 1)
  })
})

describe('AUT-05 respuesta tardía', () => {
  it('la carga nueva deja inválida a la anterior', () => {
    const guardia = crearGuardia()
    const primera = guardia.iniciar()
    const segunda = guardia.iniciar()
    assert.equal(guardia.esVigente(primera), false)
    assert.equal(guardia.esVigente(segunda), true)
  })

  it('un 500 agota los intentos sin presentarse como éxito', async () => {
    const resultado = await consultarConReintento(
      async () => ({ ok: false, status: 500, error: 'fallo' }),
      { intentos: 2, dormir: async () => {} }
    )
    assert.equal(resultado.ok, false)
    assert.equal(resultado.intentos, 2)
    assert.equal(resultado.status, 500)
  })
})
