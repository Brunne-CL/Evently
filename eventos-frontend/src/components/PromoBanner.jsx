import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Megaphone, X } from 'lucide-react'

const STORAGE_KEY = 'evently-promo-banner-dismissed'
const EASE = [0.16, 1, 0.3, 1]

/**
 * Banner digital superior (cerrable).
 * Persiste el cierre en sessionStorage para no molestar en la misma visita.
 */
export default function PromoBanner({ onVisibilityChange, onCta }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') {
        setVisible(false)
        onVisibilityChange?.(false)
        return
      }
    } catch {
      /* ignore */
    }
    setVisible(true)
    onVisibilityChange?.(true)
  }, [onVisibilityChange])

  const dismiss = () => {
    setVisible(false)
    onVisibilityChange?.(false)
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="fixed top-0 left-0 right-0 z-[55] overflow-hidden"
          role="region"
          aria-label="Banner promocional"
        >
          <div className="relative bg-evently-text text-white">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-evently-primary/30 via-transparent to-evently-energy/25" />
            <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-2.5 flex items-center justify-center gap-3 sm:gap-4">
              <Megaphone className="w-4 h-4 text-evently-energy flex-shrink-0 hidden sm:block" />
              <p className="text-xs sm:text-sm text-center leading-snug">
                <span className="font-semibold">Eventos de temporada en Querétaro</span>
                <span className="text-white/70"> — descubre lo que pasa esta semana cerca de ti.</span>
              </p>
              <button
                type="button"
                onClick={onCta}
                className="hidden sm:inline-flex flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-white text-evently-text hover:bg-evently-bg transition-colors"
              >
                Ver eventos
              </button>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Cerrar banner"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
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
