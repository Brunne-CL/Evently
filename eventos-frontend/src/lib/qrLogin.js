const CODE_RE = /^[A-Za-z0-9_-]{20,128}$/

/** Saca el código de un enlace ?qr= o de un código suelto. */
export function parseQrLoginPayload(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''

  try {
    const url = new URL(value)
    const code = url.searchParams.get('qr')
    if (code && CODE_RE.test(code.trim())) return code.trim()
  } catch {
    // No es una URL absoluta.
  }

  const fromQuery = value.match(/[?&]qr=([A-Za-z0-9_-]{20,128})/)
  if (fromQuery) return fromQuery[1]

  if (CODE_RE.test(value)) return value
  return ''
}

/** Dirección interna que Android abre en la app Evently. */
export function buildAppIntentUrl(code) {
  const qr = encodeURIComponent(code)
  return `intent://login?qr=${qr}#Intent;scheme=evently;package=mx.edu.uteq.evently;end`
}

/**
 * Enlace para pegar en Chrome. Tiene que empezar con http:
 * si empieza con intent: Chrome lo manda a una búsqueda.
 * Esa página http abre la app Evently con la sesión.
 */
export function buildQrLoginUrl(code) {
  const url = new URL('/abrir', window.location.origin)
  if (isLocalhostHost(url.hostname)) url.hostname = '10.0.2.2'
  url.searchParams.set('qr', code)
  return url.toString()
}

export function isLocalhostHost(hostname = window.location.hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
}
