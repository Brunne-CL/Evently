import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, X } from 'lucide-react'

const STORAGE_KEY = 'evently-install-dismissed'
const EASE = [0.16, 1, 0.3, 1]

/**
 * Elemento DOM de instalación (PWA).
 * Escucha beforeinstallprompt — no disponible en todas las Smart TV / wearables.
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') return
    } catch {
      /* ignore */
    }

    const onPrompt = (e) => {
      e.preventDefault()
      setDeferred(e)
      setOpen(true)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const dismiss = () => {
    setOpen(false)
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  const install = async () => {
    if (!deferred) return
    deferred.prompt()
    try {
      await deferred.userChoice
    } catch {
      /* ignore */
    }
    setDeferred(null)
    dismiss()
  }

  return (
    <AnimatePresence>
      {open && deferred && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="fixed bottom-6 left-4 sm:left-6 z-[107] w-[min(100%-2rem,22rem)]"
          role="dialog"
          aria-label="Instalar Evently"
        >
          <div className="rounded-2xl border border-evently-border bg-white shadow-elevated p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-evently-text text-white flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-evently-text mb-1">
                  Instalar Evently
                </p>
                <p className="text-xs text-evently-textSecondary leading-relaxed mb-3">
                  Añade el sitio a tu dispositivo para acceso rápido y mejor
                  desempeño móvil. En TV/wearable usa los widgets dedicados.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={install}
                    className="btn-cta rounded-xl px-3.5 py-2 text-xs"
                  >
                    Instalar
                  </button>
                  <button
                    type="button"
                    onClick={dismiss}
                    className="rounded-xl px-3.5 py-2 text-xs font-medium text-evently-muted hover:text-evently-text hover:bg-evently-surface transition-colors"
                  >
                    Ahora no
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Cerrar"
                className="w-7 h-7 rounded-full flex items-center justify-center text-evently-muted hover:text-evently-text hover:bg-evently-surface"
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
