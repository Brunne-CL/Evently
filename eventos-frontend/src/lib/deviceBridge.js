/**
 * Puente de enlace sitio ↔ dispositivos inteligentes (wearable / Smart TV).
 *
 * Datos que se transfieren y su propósito:
 * - pairCode / deviceId / deviceType → identificar y autorizar el enlace
 * - user { id, name, email } → personalizar UI sin re-login en el widget
 * - events[] (id, title, date, time, location, confirmed) → catálogo y reservas
 * - lastAction { type, eventId, at } → sincronizar confirmaciones entre pantallas
 * - syncedAt → auditoría / frescura del enlace
 *
 * Persistencia: localStorage (misma origen) + BroadcastChannel entre pestañas.
 * En producción esto iría a un endpoint /api/devices/pair del backend.
 */

const STORAGE_KEY = 'evently_device_bridge'
const CHANNEL_NAME = 'evently-device-bridge'
const CODE_TTL_MS = 15 * 60 * 1000

function now() {
  return Date.now()
}

function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function randomId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeStore(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  broadcast({ type: 'bridge:update', state })
  window.dispatchEvent(new CustomEvent('evently:bridge', { detail: state }))
  return state
}

let channel
function getChannel() {
  if (typeof BroadcastChannel === 'undefined') return null
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME)
  return channel
}

function broadcast(message) {
  try {
    getChannel()?.postMessage(message)
  } catch {
    /* ignore */
  }
}

export function getBridgeState() {
  const state = readStore()
  if (!state) return null
  if (state.pairExpiresAt && state.pairExpiresAt < now() && state.status !== 'linked') {
    return { ...state, status: 'expired' }
  }
  return state
}

/** Web inicia el enlace: genera código para TV / wearable. */
export function startPairing({ user = null, events = [] } = {}) {
  const state = {
    status: 'waiting',
    pairCode: randomCode(),
    pairExpiresAt: now() + CODE_TTL_MS,
    hostDeviceId: randomId('web'),
    hostDeviceType: 'web',
    linkedDeviceId: null,
    linkedDeviceType: null,
    user: user
      ? { id: user.id, name: user.name, email: user.email }
      : null,
    events: serializeEvents(events),
    lastAction: null,
    syncedAt: now(),
  }
  return writeStore(state)
}

/** TV o wearable se enlaza con el código mostrado en el sitio. */
export function joinWithCode(code, deviceType = 'tv') {
  const state = getBridgeState()
  if (!state || state.status === 'expired') {
    return { ok: false, error: 'Código expirado o inexistente. Genera uno nuevo en el sitio.' }
  }
  if (String(code).trim() !== String(state.pairCode)) {
    return { ok: false, error: 'Código incorrecto.' }
  }

  const next = {
    ...state,
    status: 'linked',
    linkedDeviceId: randomId(deviceType),
    linkedDeviceType: deviceType,
    syncedAt: now(),
    lastAction: {
      type: 'device_linked',
      deviceType,
      at: now(),
    },
  }
  writeStore(next)
  return { ok: true, state: next }
}

/** Actualiza el catálogo / reservas que ve el dispositivo enlazado. */
export function syncBridgePayload({ user, events, action = null } = {}) {
  const state = getBridgeState()
  if (!state) return null
  const next = {
    ...state,
    user: user
      ? { id: user.id, name: user.name, email: user.email }
      : state.user,
    events: events ? serializeEvents(events) : state.events,
    lastAction: action
      ? { ...action, at: now() }
      : state.lastAction,
    syncedAt: now(),
  }
  return writeStore(next)
}

/** Confirmar / cancelar asistencia desde el widget (intención de sync). */
export function bridgeConfirmEvent(eventId, confirmed = true) {
  const state = getBridgeState()
  if (!state || state.status !== 'linked') {
    return { ok: false, error: 'No hay dispositivo enlazado.' }
  }
  const events = (state.events || []).map((event) =>
    String(event.id) === String(eventId)
      ? { ...event, confirmed }
      : event
  )
  const next = writeStore({
    ...state,
    events,
    lastAction: {
      type: confirmed ? 'reservation_confirm' : 'reservation_cancel',
      eventId,
      at: now(),
    },
    syncedAt: now(),
  })
  return { ok: true, state: next }
}

export function unlinkBridge() {
  localStorage.removeItem(STORAGE_KEY)
  broadcast({ type: 'bridge:clear' })
  window.dispatchEvent(new CustomEvent('evently:bridge', { detail: null }))
}

export function subscribeBridge(callback) {
  const onStorage = (e) => {
    if (e.key === STORAGE_KEY) callback(getBridgeState())
  }
  const onCustom = (e) => callback(e.detail)
  const onMessage = (e) => {
    if (e?.data?.type === 'bridge:clear') callback(null)
    else if (e?.data?.state) callback(e.data.state)
  }

  window.addEventListener('storage', onStorage)
  window.addEventListener('evently:bridge', onCustom)
  const ch = getChannel()
  ch?.addEventListener('message', onMessage)

  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener('evently:bridge', onCustom)
    ch?.removeEventListener('message', onMessage)
  }
}

function serializeEvents(events = []) {
  return events.slice(0, 12).map((event) => ({
    id: event.id,
    title: event.title,
    date: event.date,
    time: event.time,
    location: event.location,
    category: event.category,
    confirmed: Boolean(event.confirmed),
  }))
}

/** Contrato de datos del widget (documentación ejecutable). */
export const BRIDGE_DATA_CONTRACT = [
  {
    field: 'pairCode',
    purpose: 'Autenticar el enlace temporal entre web y dispositivo',
  },
  {
    field: 'deviceType / deviceId',
    purpose: 'Saber si el cliente es web, Smart TV o wearable',
  },
  {
    field: 'user',
    purpose: 'Mostrar perfil y personalizar el widget sin PIN repetido',
  },
  {
    field: 'events[]',
    purpose: 'Catálogo reducido para pantallas chicas o TV a 10 pies',
  },
  {
    field: 'lastAction',
    purpose: 'Propagar confirmaciones de asistencia entre dispositivos',
  },
  {
    field: 'syncedAt',
    purpose: 'Controlar frescura del enlace y re-sync desde el repo/API',
  },
]
