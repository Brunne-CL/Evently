import { registerPlugin } from '@capacitor/core'
import { isNativeApp } from './biometric.js'

const EventlyWidget = registerPlugin('EventlyWidget')

/**
 * Elige el evento confirmado con fecha más cercana (pasado reciente o futuro).
 * Si no hay ninguno, limpia el widget.
 */
export async function syncHomeWidget(eventos = []) {
  if (!isNativeApp()) return

  try {
    const now = Date.now() - 60 * 60 * 1000
    const sorted = [...(eventos || [])]
      .filter((item) => item && item.title)
      .map((item) => ({
        item,
        at: Date.parse(item.startsAt || item.fecha_inicio || 0) || 0,
      }))
      .filter(({ at }) => at >= now)
      .sort((a, b) => a.at - b.at)

    const next = sorted[0]?.item
    if (!next) {
      await EventlyWidget.updateNextEvent({ clear: true })
      return
    }

    await EventlyWidget.updateNextEvent({
      title: String(next.title || ''),
      date: String(next.date || ''),
      time: String(next.time || ''),
      location: String(next.location || ''),
    })
  } catch {
    /* en el navegador o sin widget instalado no hace falta fallar */
  }
}

export async function clearHomeWidget() {
  if (!isNativeApp()) return
  try {
    await EventlyWidget.updateNextEvent({ clear: true })
  } catch {
    /* ignore */
  }
}
