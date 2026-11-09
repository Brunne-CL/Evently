import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  CheckCircle2,
  Link2,
  Loader2,
  MapPin,
  RefreshCw,
  Tv,
  Unplug,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useEventData } from '../context/EventDataContext.jsx'
import { apiReserveEvent, apiCancelReservation } from '../lib/api.js'
import {
  bridgeConfirmEvent,
  getBridgeState,
  joinWithCode,
  subscribeBridge,
  unlinkBridge,
} from '../lib/deviceBridge.js'
import { LOGO_DARK } from '../constants/brand.js'

const EASE = [0.16, 1, 0.3, 1]

/**
 * EventlyTVWidget — widget DOM para Smart TV.
 * Enlace con el sitio mediante código de emparejamiento (deviceBridge).
 * Navegación pensada para control remoto (focos grandes, sin hover crítico).
 */
export default function EventlyTVWidget() {
  const { user, isAuthenticated } = useAuth()
  const { events, refresh, loading } = useEventData()
  const [bridge, setBridge] = useState(() => getBridgeState())
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [screen, setScreen] = useState(() =>
    getBridgeState()?.status === 'linked' ? 'home' : 'pair'
  )

  useEffect(() => subscribeBridge(setBridge), [])

  useEffect(() => {
    if (bridge?.status === 'linked') setScreen((s) => (s === 'pair' ? 'home' : s))
  }, [bridge?.status])

  const linkedEvents = useMemo(() => {
    if (bridge?.events?.length) return bridge.events
    return events.slice(0, 8).map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      time: e.time,
      location: e.location,
      category: e.category,
      confirmed: Boolean(e.confirmed),
    }))
  }, [bridge, events])

  const handlePair = (e) => {
    e.preventDefault()
    setError('')
    const result = joinWithCode(code, 'tv')
    if (!result.ok) {
      setError(result.error)
      return
    }
    setScreen('home')
    setCode('')
  }

  const handleConfirm = useCallback(
    async (event) => {
      if (!isAuthenticated) {
        setError('Inicia sesión en el sitio web y vuelve a enlazar el dispositivo.')
        return
      }
      setBusyId(event.id)
      setError('')
      const currently = Boolean(event.confirmed)
      const apiResult = currently
        ? await apiCancelReservation(event.id)
        : await apiReserveEvent(event.id)
      setBusyId(null)

      if (!apiResult.ok) {
        setError(apiResult.error || 'No se pudo actualizar la asistencia.')
        return
      }

      bridgeConfirmEvent(event.id, !currently)
      await refresh()
      setSelected((prev) =>
        prev && String(prev.id) === String(event.id)
          ? { ...prev, confirmed: !currently }
          : prev
      )
    },
    [isAuthenticated, refresh]
  )

  const handleUnlink = () => {
    unlinkBridge()
    setSelected(null)
    setScreen('pair')
  }

  return (
    <main className="min-h-screen bg-[#0b0f0d] text-white flex flex-col">
      <header className="flex items-center justify-between gap-4 px-6 sm:px-10 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src={LOGO_DARK} alt="Evently" className="h-8 w-auto" />
          <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-emerald-300/90">
            <Tv className="w-3.5 h-3.5" />
            Smart TV Widget
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-white/60">
          {bridge?.status === 'linked' ? (
            <>
              <Link2 className="w-4 h-4 text-emerald-400" />
              Enlazado · {user?.name?.split(' ')[0] || bridge.user?.name || 'invitado'}
            </>
          ) : (
            'Sin enlace'
          )}
        </div>
      </header>

      <div className="flex-1 max-w-5xl w-full mx-auto px-6 sm:px-10 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {screen === 'pair' && (
            <motion.section
              key="pair"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="max-w-lg mx-auto text-center"
            >
              <h1 className="font-black text-3xl sm:text-4xl tracking-tight mb-3">
                Enlazar Smart TV
              </h1>
              <p className="text-white/55 text-sm sm:text-base mb-8 leading-relaxed">
                En el sitio web genera un código en <strong className="text-white/80">Dispositivos</strong>
                {' '}e introdúcelo aquí. Se transferirán eventos, perfil y confirmaciones.
              </p>

              <form onSubmit={handlePair} className="space-y-4">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  placeholder="Código de 6 dígitos"
                  className="w-full text-center text-3xl tracking-[0.4em] font-bold bg-white/5 border border-white/15 rounded-2xl px-4 py-5 focus:outline-none focus:border-emerald-400/60"
                  aria-label="Código de emparejamiento"
                />
                {error && <p className="text-rose-300 text-sm">{error}</p>}
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#0b0f0d] font-bold py-4 text-lg transition-colors"
                >
                  Enlazar dispositivo
                </button>
              </form>

              <a
                href="/"
                className="inline-flex items-center gap-2 mt-8 text-sm text-white/45 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al sitio
              </a>
            </motion.section>
          )}

          {screen === 'home' && (
            <motion.section
              key="home"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div>
                  <h1 className="font-black text-3xl sm:text-4xl tracking-tight mb-2">
                    Eventos enlazados
                  </h1>
                  <p className="text-white/50 text-sm">
                    Datos vía puente DOM · última sync{' '}
                    {bridge?.syncedAt
                      ? new Date(bridge.syncedAt).toLocaleTimeString('es-MX')
                      : '—'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => refresh()}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm hover:bg-white/5"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Actualizar
                  </button>
                  <button
                    type="button"
                    onClick={handleUnlink}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-400/30 text-rose-200 px-4 py-2.5 text-sm hover:bg-rose-400/10"
                  >
                    <Unplug className="w-4 h-4" />
                    Desenlazar
                  </button>
                </div>
              </div>

              {error && (
                <p className="mb-4 text-sm text-rose-300 bg-rose-400/10 border border-rose-400/20 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {linkedEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => {
                      setSelected(event)
                      setScreen('detail')
                    }}
                    className="text-left rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-emerald-400/50 p-5 transition-colors min-h-[7.5rem]"
                  >
                    <p className="text-[11px] uppercase tracking-wider text-emerald-300/80 mb-2">
                      {event.category || 'Evento'}
                    </p>
                    <h2 className="font-bold text-lg leading-snug mb-3">{event.title}</h2>
                    <p className="text-sm text-white/45 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {event.location || 'Querétaro'}
                    </p>
                    {event.confirmed && (
                      <span className="inline-flex items-center gap-1 mt-3 text-xs text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Confirmado
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {!linkedEvents.length && (
                <p className="text-center text-white/40 py-16">
                  No hay eventos en el puente. Genera el enlace desde el sitio con sesión activa.
                </p>
              )}
            </motion.section>
          )}

          {screen === 'detail' && selected && (
            <motion.section
              key="detail"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="max-w-xl"
            >
              <button
                type="button"
                onClick={() => setScreen('home')}
                className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>
              <h1 className="font-black text-3xl sm:text-4xl tracking-tight mb-4">
                {selected.title}
              </h1>
              <p className="text-white/55 mb-2">
                {selected.date} · {selected.time}
              </p>
              <p className="text-white/45 mb-8 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {selected.location}
              </p>
              {error && <p className="text-rose-300 text-sm mb-4">{error}</p>}
              <button
                type="button"
                disabled={busyId === selected.id}
                onClick={() => handleConfirm(selected)}
                className="w-full sm:w-auto min-w-[16rem] rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-[#0b0f0d] font-bold py-4 px-8 text-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                {busyId === selected.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                {selected.confirmed ? 'Cancelar asistencia' : 'Confirmar asistencia'}
              </button>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
