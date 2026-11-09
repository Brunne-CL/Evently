import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import { LOGO_DARK } from '../constants/brand.js'

const STORAGE_KEY = 'evently-promo-popup-dismissed'
const EASE = [0.16, 1, 0.3, 1]
const DELAY_MS = 2200

/**
 * Pop-up / banner digital modal de bienvenida (cerrable).
 * Aparece una vez por sesión tras un pequeño delay.
 */
export default function PromoPopup({ onCta }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') return
    } catch {
      /* ignore */
    }

    const timer = setTimeout(() => setOpen(true), DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const dismiss = () => {
    setOpen(false)
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  const handleCta = () => {
    dismiss()
    onCta?.()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          className="fixed inset-0 z-[105] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Banner promocional"
        >
          <motion.div
            onClick={dismiss}
            className="absolute inset-0 bg-evently-text/25 backdrop-blur-[5px]"
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="relative w-full max-w-md overflow-hidden rounded-[1.75rem] bg-white border border-evently-border shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-36 sm:h-40 bg-evently-text overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-evently-primary/40 via-transparent to-evently-energy/35" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3">
                <img
                  src={LOGO_DARK}
                  alt="Evently"
                  className="h-9 w-auto object-contain"
                  draggable={false}
                />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90">
                  <Sparkles className="w-3 h-3" />
                  Destacado
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={dismiss}
              aria-label="Cerrar anuncio"
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-evently-text flex items-center justify-center hover:bg-white transition-colors shadow-soft"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 sm:p-7">
              <h2 className="font-display font-black text-2xl tracking-tight text-evently-text mb-2">
                ¿Listo para tu próximo plan?
              </h2>
              <p className="text-sm text-evently-textSecondary leading-relaxed mb-6">
                Explora eventos en vivo en Querétaro, guarda favoritos y confirma
                asistencia desde tu smartwatch.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleCta}
                  className="btn-cta flex-1 rounded-2xl px-5 py-3 text-sm"
                >
                  Ver eventos
                </motion.button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="flex-1 rounded-2xl px-5 py-3 text-sm font-medium text-evently-textSecondary hover:text-evently-text hover:bg-evently-surface transition-colors"
                >
                  Ahora no
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
