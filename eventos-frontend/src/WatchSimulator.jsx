import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  RefreshCw,
  Watch,
} from 'lucide-react'
import { useAuth } from './context/AuthContext.jsx'
import { useEventData } from './context/EventDataContext.jsx'
import { apiCancelReservation, apiReserveEvent } from './lib/api.js'

const EASE = [0.16, 1, 0.3, 1]

function WatchClock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="text-center select-none">
      <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-300/90 mb-1">
        {now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}
      </p>
      <p className="font-black text-[3.4rem] leading-none tracking-tight bg-gradient-to-b from-white to-emerald-100/70 bg-clip-text text-transparent">
        {now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  )
}

function Screen({ id, children }) {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="min-h-full"
    >
      {children}
    </motion.div>
  )
}

export default function WatchSimulator() {
  const { user, isAuthenticated, loginWithPin, logout } = useAuth()
  const { events, loading: eventsLoading, refresh } = useEventData()
  const [screen, setScreen] = useState(isAuthenticated ? 'home' : 'login')
  const [form, setForm] = useState({ email: user?.email || '', pin: '' })
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [confirmedIds, setConfirmedIds] = useState(() => new Set())
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    setScreen(isAuthenticated ? 'home' : 'login')
    if (user?.email) setForm((current) => ({ ...current, email: user.email }))
  }, [isAuthenticated, user?.email])

  const nextEvents = useMemo(() => events.slice(0, 8), [events])

  const handleLogin = async (event) => {
    event.preventDefault()
    setError('')
    setLoginBusy(true)
    const result = await loginWithPin(form)
    setLoginBusy(false)
    if (!result.ok) {
      setError(result.error || 'No se pudo iniciar sesión.')
      return
    }
    setForm((current) => ({ ...current, pin: '' }))
    setScreen('home')
  }

  const handleSync = async () => {
    setSyncing(true)
    await refresh()
    setSyncing(false)
  }

  const openEvent = (event) => {
    setError('')
    setSelectedEvent(event)
    setScreen('detail')
  }

  const toggleReservation = async () => {
    if (!selectedEvent) return
    setError('')
    setBusyId(selectedEvent.id)
    const isConfirmed = confirmedIds.has(selectedEvent.id)
    const result = isConfirmed
      ? await apiCancelReservation(selectedEvent.id)
      : await apiReserveEvent(selectedEvent.id)
    setBusyId(null)

    if (!result.ok) {
      setError(result.error || 'No se pudo actualizar la asistencia.')
      return
    }

    setConfirmedIds((current) => {
      const next = new Set(current)
      if (isConfirmed) next.delete(selectedEvent.id)
      else next.add(selectedEvent.id)
      return next
    })
  }

  const handleLogout = async () => {
    await logout()
    setSelectedEvent(null)
    setConfirmedIds(new Set())
    setScreen('login')
  }

  return (
    <main className="min-h-screen bg-[#0c0f0e] relative flex flex-col items-center justify-center px-4 py-14 overflow-hidden">
      {/* Fondo tipo estudio */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,#1d2b24_0%,#0c0f0e_62%)]" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative z-10 text-center mb-4 sm:mb-28"
      >
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 text-emerald-300 text-[11px] font-semibold tracking-wide uppercase">
          <Watch className="w-3.5 h-3.5" />
          Evently Watch · Emulador
        </span>
        <p className="text-[11px] text-white/40 mt-2">
          Pantalla circular 360 px · conectado a la API real
        </p>
      </motion.div>

      {/* Reloj */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="relative z-10"
      >
        {/* Correas */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[calc(100%-14px)] w-28 h-24 hidden sm:block">
          <div className="w-full h-full rounded-t-[2.2rem] bg-gradient-to-b from-[#2a3330] to-[#161c19] border border-white/5 shadow-inner" />
          <div className="absolute inset-x-5 top-4 space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[3px] rounded-full bg-black/40" />
            ))}
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%-14px)] w-28 h-24 hidden sm:block">
          <div className="w-full h-full rounded-b-[2.2rem] bg-gradient-to-b from-[#161c19] to-[#2a3330] border border-white/5" />
          <div className="absolute inset-x-5 bottom-4 space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[3px] rounded-full bg-black/40" />
            ))}
          </div>
        </div>

        {/* Corona y botón lateral */}
        <div className="absolute top-[30%] -right-[13px] w-[14px] h-11 rounded-r-lg bg-gradient-to-r from-[#3a423e] to-[#20261f] border border-white/10 hidden sm:block" />
        <div className="absolute top-[55%] -right-[10px] w-[11px] h-8 rounded-r-md bg-gradient-to-r from-[#333a36] to-[#1d221e] border border-white/10 hidden sm:block" />

        {/* Bisel metálico */}
        <div className="relative rounded-full p-[7px] bg-[conic-gradient(from_210deg,#4b554f,#141817,#39423c,#0f1211,#4b554f)] shadow-[0_35px_90px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.06)]">
          <div className="rounded-full p-[6px] bg-gradient-to-b from-[#11151a] to-[#05080a]">
            <section className="relative w-[min(100vw-5rem,340px)] h-[min(100vw-5rem,340px)] sm:w-[340px] sm:h-[340px] rounded-full bg-[#060d0a] overflow-hidden">
              {/* Brillos de pantalla */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.16),transparent_46%)] pointer-events-none z-10" />
              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_45px_rgba(0,0,0,0.85)] pointer-events-none z-10" />
              <div className="absolute -top-1/4 left-1/4 w-1/2 h-1/2 bg-white/[0.045] blur-2xl rounded-full pointer-events-none z-10" />

              <div className="relative h-full overflow-y-auto px-12 py-10 text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <AnimatePresence mode="wait">
                  {screen === 'login' && (
                    <Screen id="login">
                      <form
                        onSubmit={handleLogin}
                        className="min-h-full flex flex-col justify-center"
                      >
                        <div className="flex flex-col items-center mb-5">
                          <div className="w-11 h-11 rounded-2xl bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center mb-2">
                            <Watch className="w-5 h-5 text-emerald-300" />
                          </div>
                          <p className="font-black tracking-tight text-lg leading-none">Evently</p>
                          <p className="text-[10px] text-white/45 mt-1">Acceso con PIN</p>
                        </div>

                        <div className="relative mb-2.5">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-300/80" />
                          <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(event) =>
                              setForm((current) => ({ ...current, email: event.target.value }))
                            }
                            className="w-full rounded-full bg-white/[0.07] border border-white/10 pl-10 pr-4 py-3 text-[11px] outline-none transition-colors focus:border-emerald-400/60 focus:bg-white/[0.1] placeholder:text-white/30"
                            placeholder="tu@correo.com"
                          />
                        </div>

                        <div className="relative">
                          <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-300/80" />
                          <input
                            type="password"
                            inputMode="numeric"
                            pattern="\d{4,6}"
                            required
                            value={form.pin}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                pin: event.target.value.replace(/\D/g, '').slice(0, 6),
                              }))
                            }
                            className="w-full rounded-full bg-white/[0.07] border border-white/10 pl-10 pr-4 py-3 text-center tracking-[0.4em] text-sm outline-none transition-colors focus:border-emerald-400/60 focus:bg-white/[0.1] placeholder:text-white/30 placeholder:tracking-[0.3em]"
                            placeholder="••••"
                          />
                        </div>

                        <AnimatePresence>
                          {error && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-[10px] text-rose-300 text-center mt-2.5"
                            >
                              {error}
                            </motion.p>
                          )}
                        </AnimatePresence>

                        <motion.button
                          type="submit"
                          disabled={loginBusy}
                          whileTap={{ scale: 0.97 }}
                          className="mt-4 w-full rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500 py-3 text-xs font-bold text-[#04110b] shadow-[0_6px_20px_rgba(16,185,129,0.35)] disabled:opacity-60 flex items-center justify-center gap-1.5"
                        >
                          {loginBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Entrar
                        </motion.button>
                      </form>
                    </Screen>
                  )}

                  {screen === 'home' && (
                    <Screen id="home">
                      <div className="min-h-full flex flex-col items-center justify-center">
                        <WatchClock />
                        <p className="text-[11px] text-white/50 mt-2.5">
                          Hola, <span className="text-emerald-300 font-semibold">{user?.name?.split(' ')[0]}</span>
                        </p>

                        <div className="grid grid-cols-2 gap-2.5 w-full mt-6">
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setScreen('events')}
                            className="rounded-[1.4rem] bg-gradient-to-b from-emerald-400 to-emerald-500 p-3.5 text-[#04110b] flex flex-col items-center gap-1.5 shadow-[0_6px_20px_rgba(16,185,129,0.3)]"
                          >
                            <CalendarDays className="w-5 h-5" />
                            <span className="text-[10px] font-bold">Eventos</span>
                          </motion.button>
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSync}
                            className="rounded-[1.4rem] bg-white/[0.07] border border-white/10 p-3.5 flex flex-col items-center gap-1.5"
                          >
                            <RefreshCw
                              className={`w-5 h-5 text-emerald-300 ${syncing ? 'animate-spin' : ''}`}
                            />
                            <span className="text-[10px] font-bold text-white/80">
                              {syncing ? 'Sincronizando' : 'Sincronizar'}
                            </span>
                          </motion.button>
                        </div>

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="mt-5 text-[10px] text-white/40 hover:text-white/70 transition-colors flex items-center gap-1.5"
                        >
                          <LogOut className="w-3 h-3" /> Cerrar sesión
                        </button>
                      </div>
                    </Screen>
                  )}

                  {screen === 'events' && (
                    <Screen id="events">
                      <div className="sticky top-0 z-20 -mx-12 px-12 pb-3 bg-gradient-to-b from-[#060d0a] via-[#060d0a]/95 to-transparent">
                        <div className="relative flex items-center justify-center min-h-[2rem]">
                          <button
                            type="button"
                            onClick={() => setScreen('home')}
                            className="absolute left-0 w-8 h-8 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center"
                            aria-label="Volver"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                          <div className="text-center">
                            <p className="font-bold text-sm leading-tight">Próximos</p>
                            <p className="text-[9px] text-emerald-300/80">
                              {nextEvents.length} eventos cerca
                            </p>
                          </div>
                        </div>
                      </div>

                      {eventsLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-300 mx-auto mt-16" />
                      ) : (
                        <div className="space-y-2 pb-12 pt-1">
                          {nextEvents.map((event) => (
                            <motion.button
                              type="button"
                              key={event.id}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => openEvent(event)}
                              className="w-full text-left rounded-2xl bg-white/[0.06] border border-white/10 p-3.5 hover:bg-white/[0.1] hover:border-emerald-400/30 transition-colors group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-[11px] font-bold leading-snug line-clamp-2">
                                  {event.title}
                                </p>
                                <ArrowUpRight className="w-3 h-3 text-emerald-300/0 group-hover:text-emerald-300 transition-colors shrink-0 mt-0.5" />
                              </div>
                              <p className="text-[9px] text-emerald-300 mt-1.5">{event.date}</p>
                              <p className="text-[9px] text-white/40 truncate">{event.location}</p>
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </Screen>
                  )}

                  {screen === 'detail' && selectedEvent && (
                    <Screen id="detail">
                      <div className="pb-12 min-h-full flex flex-col justify-center text-center">
                        <div className="relative flex items-center justify-center mb-3">
                          <button
                            type="button"
                            onClick={() => setScreen('events')}
                            className="absolute left-0 w-8 h-8 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center"
                            aria-label="Volver"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                          <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/25 text-[8px] uppercase tracking-[0.16em] font-bold text-emerald-300">
                            {selectedEvent.category}
                          </span>
                        </div>

                        <h1 className="font-black text-base leading-tight line-clamp-3">
                          {selectedEvent.title}
                        </h1>

                        <div className="mt-3.5 space-y-1.5 text-[10px] text-white/70">
                          <p className="flex items-center justify-center gap-1.5">
                            <CalendarDays className="w-3 h-3 text-emerald-300 shrink-0" />
                            {selectedEvent.date} · {selectedEvent.time}
                          </p>
                          <p className="flex items-center justify-center gap-1.5">
                            <MapPin className="w-3 h-3 text-emerald-300 shrink-0" />
                            <span className="line-clamp-1">{selectedEvent.location}</span>
                          </p>
                        </div>

                        <AnimatePresence>
                          {error && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="text-[10px] text-rose-300 mt-3"
                            >
                              {error}
                            </motion.p>
                          )}
                        </AnimatePresence>

                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.96 }}
                          onClick={toggleReservation}
                          disabled={busyId === selectedEvent.id}
                          className={`mt-5 w-full rounded-full py-3 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors ${
                            confirmedIds.has(selectedEvent.id)
                              ? 'bg-white/[0.08] border border-emerald-400/40 text-emerald-300'
                              : 'bg-gradient-to-b from-emerald-400 to-emerald-500 text-[#04110b] shadow-[0_6px_20px_rgba(16,185,129,0.35)]'
                          }`}
                        >
                          {busyId === selectedEvent.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : confirmedIds.has(selectedEvent.id) ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : null}
                          {confirmedIds.has(selectedEvent.id)
                            ? 'Asistencia confirmada'
                            : 'Confirmar asistencia'}
                        </motion.button>
                      </div>
                    </Screen>
                  )}
                </AnimatePresence>
              </div>
            </section>
          </div>
        </div>
      </motion.div>

      <motion.a
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        href="/"
        className="relative z-10 mt-4 sm:mt-28 inline-flex items-center gap-1.5 text-xs font-semibold text-white/40 hover:text-emerald-300 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver a Evently web
      </motion.a>
    </main>
  )
}
