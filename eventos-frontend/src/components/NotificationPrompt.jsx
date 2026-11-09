import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, BellOff, BellRing, X } from 'lucide-react'
import { describeEnvironment, detectCapabilities } from '../lib/capabilities.js'
import {
  getNotificationPermission,
  requestNotificationPermission,
  showBrowserNotification,
} from '../lib/notifications.js'

const STORAGE_KEY = 'evently-notif-prompt-dismissed'
const EASE = [0.16, 1, 0.3, 1]

/**
 * Prompt de notificaciones del navegador.
 * Se oculta en rutas wearable y en entornos sin Notification API (p. ej. muchas TV).
 */
export default function NotificationPrompt({ showToast }) {
  const [open, setOpen] = useState(false)
  const [permission, setPermission] = useState(() => getNotificationPermission())
  const caps = detectCapabilities()
  const envLabel = describeEnvironment(caps)

  useEffect(() => {
    if (caps.watchRoute || caps.tvLike || !caps.notifications) return
    if (permission === 'granted' || permission === 'denied') return
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') return
    } catch {
      /* ignore */
    }
    const timer = setTimeout(() => setOpen(true), 4500)
    return () => clearTimeout(timer)
  }, [caps.watchRoute, caps.tvLike, caps.notifications, permission])

  const dismiss = () => {
    setOpen(false)
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  const enable = async () => {
    const result = await requestNotificationPermission()
    setPermission(result.permission)
    if (result.ok) {
      showBrowserNotification('Evently', {
        body: 'Notificaciones activadas. Te avisaremos de tus eventos en Querétaro.',
        tag: 'evently-welcome',
      })
      showToast?.('Notificaciones activadas', 'success')
      dismiss()
      return
    }
    if (result.permission === 'unsupported') {
      showToast?.(
        `Este entorno (${envLabel}) no soporta notificaciones del navegador.`,
        'info'
      )
    } else if (result.permission === 'denied') {
      showToast?.('Permiso denegado. Puedes activarlo en ajustes del navegador.', 'info')
    } else {
      showToast?.('No se pudo activar notificaciones.', 'info')
    }
    dismiss()
  }

  if (!caps.notifications || caps.watchRoute) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="fixed bottom-6 right-4 sm:right-6 z-[108] w-[min(100%-2rem,22rem)]"
          role="dialog"
          aria-label="Activar notificaciones"
        >
          <div className="rounded-2xl border border-evently-border bg-white shadow-elevated p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-evently-text text-white flex items-center justify-center flex-shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-evently-text mb-1">
                  Activa recordatorios
                </p>
                <p className="text-xs text-evently-textSecondary leading-relaxed mb-3">
                  En {envLabel.toLowerCase()} puedes recibir avisos de eventos.
                  En wearables y muchas Smart TV usamos la app / simulador en su lugar.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={enable}
                    className="btn-cta inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    Activar
                  </button>
                  <button
                    type="button"
                    onClick={dismiss}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-evently-muted hover:text-evently-text hover:bg-evently-surface transition-colors"
                  >
                    <BellOff className="w-3.5 h-3.5" />
                    Ahora no
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Cerrar"
                className="w-7 h-7 rounded-full flex items-center justify-center text-evently-muted hover:text-evently-text hover:bg-evently-surface transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
