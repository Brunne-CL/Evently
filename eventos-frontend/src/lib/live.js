import { apiUrl, getToken } from './api.js'

/** Una sola conexión. El navegador la vuelve a abrir si se corta. */
export function openLive(onChange) {
  const token = getToken()
  const query = token ? `?token=${encodeURIComponent(token)}` : ''
  const source = new EventSource(apiUrl(`/api/live${query}`))

  source.onmessage = (event) => {
    try {
      onChange(JSON.parse(event.data))
    } catch {
      /* un aviso mal formado no debe tumbar la página */
    }
  }

  return () => source.close()
}
