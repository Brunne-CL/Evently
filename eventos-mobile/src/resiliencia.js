export function esperaReintento(intento) {
  return Math.min(1600, 200 * 2 ** intento)
}

/**
 * Reintenta solo lecturas. Una escritura no entra aquí: repetirla puede duplicar.
 * `pedir` debe devolver { ok, status }. status 0 o ausente significa que no hubo HTTP.
 */
export async function consultarConReintento(pedir, opciones = {}) {
  const intentos = opciones.intentos ?? 3
  const esperar = opciones.esperar || esperaReintento
  const dormir = opciones.dormir || ((ms) => new Promise((resolver) => setTimeout(resolver, ms)))
  let ultimo
  const esperas = []
  for (let i = 0; i < intentos; i += 1) {
    ultimo = await pedir(i)
    const status = ultimo?.status
    const reintentar = ultimo?.ok === false && (status === 0 || status >= 500)
    if (!reintentar) return { ...ultimo, intentos: i + 1, esperas }
    if (i < intentos - 1) {
      const pausa = esperar(i)
      esperas.push(pausa)
      await dormir(pausa)
    }
  }
  return { ...ultimo, intentos, esperas }
}

/** La respuesta tardía de una pantalla anterior no pisa a la más reciente. */
export function crearGuardia() {
  let vigente = 0
  return {
    iniciar() {
      vigente += 1
      return vigente
    },
    esVigente(id) {
      return id === vigente
    },
  }
}
