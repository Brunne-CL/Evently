import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link2, RefreshCw, Tv, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useEventData } from '../context/EventDataContext.jsx'
import {
  getBridgeState,
  startPairing,
  subscribeBridge,
  unlinkBridge,
} from '../lib/deviceBridge.js'

const EASE = [0.16, 1, 0.3, 1]

/**
 * Modal "Dispositivos" — genera el código que la Smart TV ingresa en /tv.
 * Práctica 09: enlace web ↔ EventlyTVWidget vía deviceBridge.
 */
export default function DevicePairingModal({ open, onClose }) {
  const { user, isAuthenticated } = useAuth()
  const { events } = useEventData()
  const [bridge, setBridge] = useState(() => getBridgeState())

  useEffect(() => {
    if (!open) return undefined
    return subscribeBridge(setBridge)
  }, [open])

  useEffect(() => {
    if (!open) return
    const current = getBridgeState()
    if (!current || current.status === 'expired' || current.status === 'linked') {
      // Al abrir, siempre ofrecer un código fresco si no hay enlace activo
      if (!current || current.status !== 'linked') {
        startPairing({ user, events })
        setBridge(getBridgeState())
      }
    }
  }, [open, user, events])

  const regenerate = () => {
    startPairing({ user, events })
    setBridge(getBridgeState())
  }

  const unlink = () => {
    unlinkBridge()
    startPairing({ user, events })
    setBridge(getBridgeState())
  }

  const code = bridge?.pairCode || '------'
  const linked = bridge?.status === 'linked'
  const expiresAt = bridge?.pairExpiresAt
  const remainingMin = expiresAt
    ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 60000))
    : 0

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label="Cerrar"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="devices-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="relative w-full max-w-md rounded-2xl bg-white border border-evently-border shadow-elevated p-6 sm:p-7"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-evently-muted hover:text-evently-text hover:bg-evently-bg"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1 text-evently-primary">
              <Tv className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-widest">
                Dispositivos
              </span>
            </div>
            <h2 id="devices-title" className="font-display font-black text-xl text-evently-text mb-2">
              Enlazar Smart TV
            </h2>
            <p className="text-sm text-evently-textSecondary mb-5 leading-relaxed">
              Abre Evently en el televisor e introduce este código. Dura 15 minutos.
            </p>

            {!isAuthenticated && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                Puedes emparejar sin sesión, pero para confirmar asistencia en la TV
                debes iniciar sesión en esta pestaña.
              </p>
            )}

            {linked ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 mb-4">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm mb-1">
                  <Link2 className="w-4 h-4" />
                  TV vinculada
                </div>
                <button
                  type="button"
                  onClick={unlink}
                  className="mt-3 text-sm font-medium text-emerald-900 underline"
                >
                  Desvincular y generar otro código
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-evently-border bg-evently-bg p-5 text-center mb-4">
                <p className="text-[11px] uppercase tracking-widest text-evently-muted mb-2">
                  Código de emparejamiento
                </p>
                <p className="font-mono text-3xl sm:text-4xl font-black tracking-[0.35em] text-evently-text pl-[0.35em]">
                  {code}
                </p>
                <p className="text-xs text-evently-muted mt-2">
                  Expira en ~{remainingMin} min
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={regenerate}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-evently-border text-sm font-medium hover:bg-evently-bg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Nuevo código
              </button>
              <a
                href="/tv"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-evently-text text-white text-sm font-medium hover:opacity-90"
              >
                Abrir widget TV
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
