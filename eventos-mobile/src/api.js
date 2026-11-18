import * as SecureStore from 'expo-secure-store'
import { consultarConReintento } from './resiliencia'

export const API_BASE = 'http://34.200.232.137'
const TOKEN_KEY = 'evently_token'

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function setToken(token) {
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token)
  else await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export function parseQrCode(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''

  const fromQuery = value.match(/[?&#]qr=([A-Za-z0-9_-]{20,128})/)
  if (fromQuery) return fromQuery[1]

  try {
    const url = new URL(value)
    const code = url.searchParams.get('qr')
    if (code && /^[A-Za-z0-9_-]{20,128}$/.test(code)) return code
  } catch {
    // No es una URL absoluta (puede ser evently:// o solo el código).
  }

  const fromIntent = value.match(/qr=([A-Za-z0-9_-]{20,128})/)
  if (fromIntent) return fromIntent[1]

  if (/^[A-Za-z0-9_-]{20,128}$/.test(value)) return value
  return ''
}

export async function api(path, { method = 'GET', body, auth = false, timeoutMs = 8000 } = {}) {
  const ejecutar = () => llamarUnaVez(path, { method, body, auth, timeoutMs })
  if (method !== 'GET') return ejecutar()
  return consultarConReintento(ejecutar, { intentos: 3 })
}

async function llamarUnaVez(path, { method, body, auth, timeoutMs }) {
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json' }
  if (auth) {
    const token = await getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (err) {
    const timeout = err?.name === 'TimeoutError'
    return {
      ok: false,
      status: 0,
      error: timeout ? 'El servidor no respondió a tiempo.' : 'No se pudo conectar con la instancia.',
    }
  }

  let data = {}
  try {
    data = await res.json()
  } catch {
    data = { ok: false, error: 'Respuesta inválida del servidor.' }
  }
  if (!res.ok) {
    return { ok: false, error: data.error || `Error ${res.status}`, status: res.status }
  }
  return data
}
