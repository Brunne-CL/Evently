/**
 * Cliente HTTP hacia la API Evently (Express + MySQL).
 * Token JWT en sessionStorage (sesión de pestaña) + localStorage opcional.
 *
 * Por el túnel (trycloudflare / loca.lt) SIEMPRE usa rutas relativas `/api/...`
 * para que Vite haga de proxy. Así el navegador del profesor no intenta
 * hablar con localhost en SU máquina.
 */

function resolveApiBase() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || ''
    if (
      host.includes('trycloudflare.com') ||
      host.includes('loca.lt') ||
      host.endsWith('.local')
    ) {
      return ''
    }
  }

  const envUrl = (import.meta.env.VITE_API_URL || '').trim()
  // Si alguien dejó VITE_API_URL=http://localhost:4000, en túnel ya se forzó '' arriba.
  // En dev local también preferimos el proxy de Vite.
  if (import.meta.env.DEV) return ''
  if (envUrl) return envUrl.replace(/\/$/, '')
  return 'http://127.0.0.1:4000'
}

const API_BASE = resolveApiBase()

const TOKEN_KEY = 'evently_token'
const USER_KEY = 'evently_user'

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)
}

export function getCachedUser() {
  try {
    const raw = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function persistSession({ user, token }, remember = true) {
  const store = remember ? localStorage : sessionStorage
  const other = remember ? sessionStorage : localStorage
  store.setItem(TOKEN_KEY, token)
  store.setItem(USER_KEY, JSON.stringify(user))
  other.removeItem(TOKEN_KEY)
  other.removeItem(USER_KEY)
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' }
  if (auth) {
    const token = getToken()
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
    return {
      ok: false,
      error: 'No se pudo conectar con el servidor.',
      offline: true,
    }
  }

  let data = {}
  try {
    data = await res.json()
  } catch {
    data = { ok: false, error: 'Respuesta inválida del servidor.' }
  }

  if (!res.ok) {
    return {
      ok: false,
      error: data.error || `Error ${res.status}`,
      code: data.code,
      status: res.status,
    }
  }

  return data
}

export async function apiRegister(payload) {
  const data = await request('/api/auth/register', { method: 'POST', body: payload })
  if (data.ok && data.token) persistSession(data)
  return data
}

export async function apiLogin(payload) {
  const data = await request('/api/auth/login', { method: 'POST', body: payload })
  if (data.ok && data.token) persistSession(data)
  return data
}

export async function apiPinLogin(payload) {
  const data = await request('/api/auth/pin-login', { method: 'POST', body: payload })
  if (data.ok && data.token) persistSession(data)
  return data
}

/** La web, ya autenticada, pide un código de un solo uso para el teléfono. */
export async function apiCreateQrLogin() {
  return request('/api/auth/qr-login', { method: 'POST', auth: true })
}

/** pending | used | expired */
export async function apiQrLoginStatus(code) {
  return request(`/api/auth/qr-login/${encodeURIComponent(code)}`, { auth: true })
}

/** El teléfono canjea el código del QR por una sesión. */
export async function apiRedeemQrLogin(code) {
  const data = await request('/api/auth/qr-login/redeem', { method: 'POST', body: { code } })
  if (data.ok && data.token) persistSession(data, true)
  return data
}

export async function apiLogout() {
  await request('/api/auth/logout', { method: 'POST', auth: true })
  clearSession()
  return { ok: true }
}

export async function apiMe() {
  const data = await request('/api/auth/me', { auth: true })
  if (data.ok && data.user) {
    const token = getToken()
    if (token) persistSession({ user: data.user, token })
  }
  if (!data.ok && (data.status === 401 || data.code === 'UNAUTHORIZED' || data.code === 'TOKEN_INVALID')) {
    clearSession()
  }
  return data
}

export async function apiSetPin(payload) {
  const data = await request('/api/auth/set-pin', { method: 'POST', body: payload, auth: true })
  if (data.ok && data.user) {
    const token = getToken()
    if (token) persistSession({ user: data.user, token })
  }
  return data
}

export async function apiUpdateProfile(payload) {
  const data = await request('/api/auth/profile', { method: 'PATCH', body: payload, auth: true })
  if (data.ok && data.user) {
    const token = getToken()
    if (token) persistSession({ user: data.user, token })
  }
  return data
}

export async function apiMisEventos() {
  return request('/api/auth/mis-eventos', { auth: true })
}

export async function apiAdminOverview() {
  return request('/api/admin/overview', { auth: true })
}

export async function apiCategories() {
  return request('/api/categories')
}

export async function apiEvents(categoryId) {
  const query = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : ''
  return request(`/api/events${query}`)
}

export async function apiReserveEvent(eventId) {
  return request(`/api/events/${eventId}/reservation`, {
    method: 'POST',
    auth: true,
  })
}

export async function apiCancelReservation(eventId) {
  return request(`/api/events/${eventId}/reservation`, {
    method: 'DELETE',
    auth: true,
  })
}

export async function apiAddFavorite(eventId) {
  return request(`/api/events/${eventId}/favorite`, {
    method: 'POST',
    auth: true,
  })
}

export async function apiRemoveFavorite(eventId) {
  return request(`/api/events/${eventId}/favorite`, {
    method: 'DELETE',
    auth: true,
  })
}

export { API_BASE }
