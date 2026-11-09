import { detectCapabilities } from './capabilities.js'

/**
 * Notificaciones del navegador (Notification API).
 * En wearables embebidos y muchas Smart TV esta API no existe:
 * el llamador debe degradar a toast / UI in-app.
 */

export function getNotificationPermission() {
  if (!detectCapabilities().notifications) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission() {
  if (!detectCapabilities().notifications) {
    return { ok: false, permission: 'unsupported' }
  }
  if (Notification.permission === 'granted') {
    return { ok: true, permission: 'granted' }
  }
  if (Notification.permission === 'denied') {
    return { ok: false, permission: 'denied' }
  }
  try {
    const permission = await Notification.requestPermission()
    return { ok: permission === 'granted', permission }
  } catch {
    return { ok: false, permission: 'error' }
  }
}

/**
 * Muestra una notificación del sistema si está permitido.
 * @returns {boolean} true si se mostró notificación nativa
 */
export function showBrowserNotification(title, options = {}) {
  if (!detectCapabilities().notifications) return false
  if (Notification.permission !== 'granted') return false

  try {
    const notification = new Notification(title, {
      icon: '/logos/Evently_logo_1.png',
      badge: '/logos/Evently_logo_1.png',
      lang: 'es-MX',
      ...options,
    })
    notification.onclick = () => {
      window.focus()
      notification.close()
      if (typeof options.onClick === 'function') options.onClick()
    }
    return true
  } catch {
    return false
  }
}

/**
 * Recordatorio de evento: intenta notificación nativa; si no, false.
 */
export function notifyEventReminder(event) {
  if (!event) return false
  return showBrowserNotification(`Recordatorio · ${event.title}`, {
    body: `${event.date || ''} ${event.time || ''} · ${event.location || 'Querétaro'}`.trim(),
    tag: `evently-event-${event.id}`,
  })
}
