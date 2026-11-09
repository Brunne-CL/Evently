import * as SecureStore from 'expo-secure-store'

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
  const fromQuery = value.match(/[?&]qr=([A-Za-z0-9_-]{20,128})/)
  if (fromQuery) return fromQuery[1]
  if (/^[A-Za-z0-9_-]{20,128}$/.test(value)) return value
  return ''
}

export async function api(path, { method = 'GET', body, auth = false } = {}) {
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
    })
  } catch {
    return { ok: false, error: 'No se pudo conectar con la instancia.' }
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
