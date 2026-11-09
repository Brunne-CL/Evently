/**
 * Detección de capacidades del cliente.
 * No todos los entornos (Smart TV, wearables embebidos) soportan
 * las mismas APIs que Chrome/Safari/Firefox en móvil o escritorio.
 */

export function detectCapabilities() {
  if (typeof window === 'undefined') {
    return {
      notifications: false,
      touch: false,
      reducedMotion: false,
      mobileViewport: false,
      standalonePwa: false,
      watchRoute: false,
      tvLike: false,
    }
  }

  const ua = navigator.userAgent || ''
  const path = window.location.pathname || ''
  const width = window.innerWidth || 0
  const height = window.innerHeight || 0

  const notifications = 'Notification' in window
  const touch =
    'ontouchstart' in window ||
    (navigator.maxTouchPoints || 0) > 0
  const reducedMotion = window.matchMedia?.(
    '(prefers-reduced-motion: reduce)'
  )?.matches
  const mobileViewport = width < 768
  const standalonePwa =
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    navigator.standalone === true
  const watchRoute = path === '/watch' || path.startsWith('/watch/')
  const tvLike =
    /SmartTV|Smart-TV|Web0S|Tizen|BRAVIA|AppleTV|GoogleTV|Android TV/i.test(ua) ||
    (width >= 1280 && height <= 800 && !touch && !mobileViewport)

  return {
    notifications,
    touch,
    reducedMotion: Boolean(reducedMotion),
    mobileViewport,
    standalonePwa,
    watchRoute,
    tvLike,
  }
}

/** Etiqueta legible del entorno para UI / depuración. */
export function describeEnvironment(caps = detectCapabilities()) {
  if (caps.watchRoute) return 'Wearable (simulador)'
  if (caps.tvLike) return 'Smart TV / pantalla grande'
  if (caps.mobileViewport) return 'Móvil'
  if (caps.standalonePwa) return 'PWA instalada'
  return 'Escritorio / navegador web'
}
