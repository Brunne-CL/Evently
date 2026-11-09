/**
 * EVENTLY · Landing Page · Nothing-inspired Light Premium
 * bg #F8F5F0 · primary #3D5C48 · energy #F43F5E · text #111827
 */

import { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from 'react'
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useInView,
} from 'framer-motion'
import {
  // Marca / navegación
  Sparkles,
  Menu,
  X,
  ArrowUp,
  Palette,
  // Eventos / UI
  Calendar,
  MapPin,
  Clock,
  Heart,
  ArrowRight,
  PlayCircle,
  Search,
  Watch,
  CheckCircle2,
  Ticket,
  BellRing,
  BadgeCheck,
  // Footer / social
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Mail,
  ChevronRight,
  ChevronLeft,
  Zap,
  FileText,
  LogOut,
  Lock,
  UserRound,
  QrCode,
} from 'lucide-react'
import { useAuth } from './context/AuthContext.jsx'
import { useEventData } from './context/EventDataContext.jsx'
import AuthModal from './components/AuthModal.jsx'
import QrSessionModal from './components/QrSessionModal.jsx'
import EventDetailModal from './components/EventDetailModal.jsx'
import ProfileModal from './components/ProfileModal.jsx'
import PromoBanner from './components/PromoBanner.jsx'
import PromoPopup from './components/PromoPopup.jsx'
import NotificationPrompt from './components/NotificationPrompt.jsx'
import InstallPrompt from './components/InstallPrompt.jsx'
import { LOGO_LIGHT, LOGO_DARK } from './constants/brand.js'
import { apiMisEventos, apiReserveEvent } from './lib/api.js'

const EASE = [0.16, 1, 0.3, 1]

function EventlyLogo({ variant = 'light', className = '' }) {
  const src = variant === 'dark' ? LOGO_DARK : LOGO_LIGHT
  return (
    <img
      src={src}
      alt="Evently"
      className={`object-contain select-none ${className}`}
      draggable={false}
    />
  )
}
const SECTION_IDS = ['inicio', 'categorias', 'eventos', 'mis-eventos', 'como-funciona']

/* ——— UX · Hooks & feedback global ——— */
const ToastContext = createContext(null)

function useToast() {
  return useContext(ToastContext)
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduced
}

function useActiveSection(ids = SECTION_IDS) {
  const [active, setActive] = useState(ids[0])

  useEffect(() => {
    const observers = []
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id)
        },
        { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [ids])

  return active
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 3800)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.35, ease: EASE }}
              className={`glass-strong rounded-2xl px-4 py-3 shadow-elevated flex items-center gap-3 pointer-events-auto ${
                toast.type === 'success'
                  ? 'border-evently-primary/30'
                  : toast.type === 'favorite'
                    ? 'border-evently-energy/30'
                    : 'border-evently-border'
              }`}
            >
              {toast.type === 'success' && (
                <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              )}
              {toast.type === 'favorite' && (
                <div className="w-8 h-8 rounded-full bg-evently-energy/15 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-4 h-4 text-evently-energy fill-evently-energy" />
                </div>
              )}
              {toast.type === 'info' && (
                <div className="w-8 h-8 rounded-full bg-evently-surface flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-evently-primary" />
                </div>
              )}
              <p className="text-sm font-medium text-evently-text leading-snug">{toast.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <motion.div
      style={{ scaleX, transformOrigin: '0% 50%' }}
      className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-brand z-[60] pointer-events-none"
      aria-hidden
    />
  )
}

function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.9 }}
          transition={{ duration: 0.35, ease: EASE }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Volver arriba"
          className="fixed bottom-6 right-5 sm:right-8 z-50 w-11 h-11 rounded-full glass-strong flex items-center justify-center text-evently-textSecondary hover:text-evently-primary hover:shadow-glow transition-all duration-500"
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const EVENT_ROTATE_MS = 4000

function Navbar({ onOpenSearch, onOpenAuth, onOpenProfile, onOpenQr, offsetTop = 0 }) {
  const { user, logout, isAuthenticated } = useAuth()
  const { totalEvents } = useEventData()
  const eventsBadge = formatEventsBadge(totalEvents)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const activeSection = useActiveSection(SECTION_IDS)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: 'Eventos',    href: '#eventos',    id: 'eventos' },
    { label: 'Categorías', href: '#categorias', id: 'categorias' },
    ...(isAuthenticated ? [{ label: 'Mis eventos', href: '#mis-eventos', id: 'mis-eventos' }] : []),
  ]

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?'

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    setMobileOpen(false)
  }

  const openProfile = () => {
    setUserMenuOpen(false)
    setMobileOpen(false)
    onOpenProfile?.()
  }

  const openQr = () => {
    setUserMenuOpen(false)
    setMobileOpen(false)
    onOpenQr?.()
  }

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: EASE }}
      style={{ top: offsetTop }}
      className={`fixed left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'glass-strong border-b border-evently-border/80 py-3 shadow-soft'
          : 'bg-evently-bg/80 backdrop-blur-md py-5'
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between gap-6">
          <motion.a
            href="#inicio"
            whileHover={{ opacity: 0.85 }}
            transition={{ duration: 0.2 }}
            className="flex items-center flex-shrink-0"
          >
            <EventlyLogo variant="light" className="h-9 sm:h-10 w-auto" />
          </motion.a>

          <motion.button
            whileHover={{ scale: 1.005, y: -1 }}
            whileTap={{ scale: 0.995 }}
            onClick={onOpenSearch}
            aria-label="Buscar eventos"
            className="hidden md:flex flex-1 max-w-lg lg:max-w-xl items-center gap-3.5 px-5 py-3.5 rounded-[20px] bg-white border border-evently-border/60 shadow-soft hover:shadow-elevated hover:border-[#10B981]/25 transition-all duration-500 group"
          >
            <Search className="w-5 h-5 text-evently-muted group-hover:text-[#10B981] transition-colors flex-shrink-0" />
            <span className="text-sm text-evently-muted truncate">
              Buscar eventos, fiestas, festivales...
            </span>
            <span className="search-events-badge ml-auto hidden sm:inline-flex">
              {eventsBadge}
            </span>
            <kbd className="hidden xl:inline-flex text-[10px] font-medium text-evently-muted px-2 py-0.5 rounded-md border border-evently-border bg-evently-bg/80">
              ⌘K
            </kbd>
          </motion.button>

          <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`relative text-sm font-medium transition-colors duration-500 py-1 ${
                    isActive ? 'text-evently-text' : 'text-evently-textSecondary hover:text-evently-text'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-brand rounded-full"
                      transition={{ duration: 0.4, ease: EASE }}
                    />
                  )}
                </a>
              )
            })}
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="text-sm font-medium text-evently-textSecondary hover:text-evently-text transition-colors"
                >
                  Iniciar sesión
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onOpenAuth('register')}
                  className="btn-cta text-sm px-5 py-2.5 rounded-full"
                >
                  Registrarse
                </motion.button>
              </>
            ) : (
              <div className="relative flex items-center gap-2">
                <button
                  type="button"
                  onClick={openQr}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-evently-border bg-white text-sm font-medium text-evently-text hover:shadow-soft transition-all"
                  aria-label="Entrar en el teléfono con código QR"
                >
                  <QrCode className="w-4 h-4" />
                  <span className="hidden xl:inline">Teléfono</span>
                </button>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-evently-border bg-white hover:shadow-soft transition-all duration-300"
                  aria-label="Menú de usuario"
                >
                  <div className="w-8 h-8 rounded-full bg-evently-text flex items-center justify-center text-xs font-bold text-white">
                    {userInitials}
                  </div>
                  <span className="text-sm font-medium text-evently-text max-w-[90px] truncate hidden xl:inline">
                    {user.name.split(' ')[0]}
                  </span>
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: EASE }}
                        className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl border border-evently-border shadow-elevated overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b border-evently-border/80">
                          <p className="text-sm font-semibold text-evently-text truncate">{user.name}</p>
                          <p className="text-xs text-evently-muted truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={openProfile}
                          className="w-full flex items-center gap-2 px-4 py-3 text-sm text-evently-textSecondary hover:text-evently-text hover:bg-evently-surface transition-colors border-b border-evently-border/60"
                        >
                          <UserRound className="w-4 h-4" />
                          Mi perfil
                        </button>
                        <button
                          onClick={openQr}
                          className="w-full flex items-center gap-2 px-4 py-3 text-sm text-evently-textSecondary hover:text-evently-text hover:bg-evently-surface transition-colors border-b border-evently-border/60"
                        >
                          <QrCode className="w-4 h-4" />
                          Entrar en el teléfono
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-3 text-sm text-evently-muted hover:text-evently-text hover:bg-evently-surface transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Cerrar sesión
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="lg:hidden flex items-center gap-1">
            <button onClick={onOpenSearch} aria-label="Buscar" className="p-2 text-evently-textSecondary hover:text-evently-primary transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button onClick={() => setMobileOpen((v) => !v)} className="p-2 text-evently-text" aria-label="Menú">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="lg:hidden border-t border-evently-border bg-white/90 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-5 py-8 flex flex-col gap-1">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, ease: EASE }}
                  onClick={() => setMobileOpen(false)}
                  className="text-evently-text font-medium py-3 text-lg border-b border-evently-border/60 last:border-0"
                >
                  {link.label}
                </motion.a>
              ))}
              <div className="pt-6 flex flex-col gap-3">
                {!isAuthenticated ? (
                  <>
                    <button onClick={() => { setMobileOpen(false); onOpenAuth('login') }} className="text-left py-2 font-medium text-evently-textSecondary">
                      Iniciar sesión
                    </button>
                    <button onClick={() => { setMobileOpen(false); onOpenAuth('register') }} className="btn-cta py-3.5 rounded-full font-semibold">
                      Registrarse
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-9 h-9 rounded-full bg-evently-text flex items-center justify-center text-xs font-bold text-white">{userInitials}</div>
                      <div>
                        <p className="text-sm font-semibold text-evently-text">{user.name}</p>
                        <p className="text-xs text-evently-muted">{user.email}</p>
                      </div>
                    </div>
                    <button onClick={openProfile} className="flex items-center gap-2 py-2 text-evently-textSecondary hover:text-evently-text">
                      <UserRound className="w-4 h-4" /> Mi perfil
                    </button>
                    <button onClick={openQr} className="flex items-center gap-2 py-2 text-evently-textSecondary hover:text-evently-text">
                      <QrCode className="w-4 h-4" /> Entrar en el teléfono
                    </button>
                    <button onClick={handleLogout} className="flex items-center gap-2 py-2 text-evently-muted hover:text-evently-text">
                      <LogOut className="w-4 h-4" /> Cerrar sesión
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

/* ——— HERO · Nothing light premium ——— */
function Hero() {
  const { events, loading, error } = useEventData()
  const ref = useRef(null)
  const [heroEventIdx, setHeroEventIdx] = useState(0)
  const [heroPaused, setHeroPaused] = useState(false)
  const [heroProgressKey, setHeroProgressKey] = useState(0)
  const reduced = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [0, 120])
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 60])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
  }

  const heroEvent = events[heroEventIdx]

  const goToHeroEvent = useCallback((index) => {
    if (!events.length) return
    setHeroEventIdx(((index % events.length) + events.length) % events.length)
    setHeroProgressKey((k) => k + 1)
  }, [events.length])

  useEffect(() => {
    if (heroPaused || reduced || events.length < 2) return
    const id = setInterval(() => {
      setHeroEventIdx((i) => (i + 1) % events.length)
      setHeroProgressKey((k) => k + 1)
    }, EVENT_ROTATE_MS)
    return () => clearInterval(id)
  }, [heroPaused, reduced, events.length])

  useEffect(() => {
    if (heroEventIdx >= events.length) setHeroEventIdx(0)
  }, [events.length, heroEventIdx])

  if (!heroEvent) {
    return (
      <section
        id="inicio"
        ref={ref}
        className="min-h-[100svh] flex items-center justify-center px-5 text-center"
      >
        <div>
          <div className="w-10 h-10 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-evently-text font-semibold">
            {loading ? 'Cargando eventos desde MySQL…' : 'No hay eventos disponibles'}
          </p>
          {error && <p className="text-evently-muted text-sm mt-2">{error}</p>}
        </div>
      </section>
    )
  }

  return (
    <section
      id="inicio"
      ref={ref}
      className="relative min-h-[100svh] flex items-center overflow-hidden pt-28 pb-16 lg:pb-24"
    >
      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="ambient-orb -top-32 -left-32 w-[500px] h-[500px] bg-evently-primary/8"
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, 35, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
          className="ambient-orb top-1/3 -right-40 w-[420px] h-[420px] bg-evently-secondary/10"
        />
        <motion.div
          animate={{ opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="ambient-orb bottom-0 left-1/3 w-[360px] h-[360px] bg-evently-energy/6"
        />
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Copy */}
          <motion.div
            style={{ y, opacity }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative z-10"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <div className="glass inline-flex items-center gap-2.5 rounded-full px-4 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 bg-evently-primary" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-evently-primary" />
                </span>
                <span className="text-xs sm:text-sm font-medium text-evently-textSecondary inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-evently-primary" />
                  Querétaro, México
                </span>
              </div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="font-display font-black text-[2.75rem] sm:text-5xl md:text-6xl lg:text-[4.25rem] leading-[1.02] tracking-[-0.03em] mb-7 text-evently-text"
            >
              Descubre
              <br />
              <span className="text-gradient">eventos</span>
              <br />
              <span className="text-evently-textSecondary font-bold">en Querétaro</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg text-evently-textSecondary max-w-lg mb-10 leading-relaxed"
            >
              Fiestas, festivales, meetups y charlas — curados para ti.
              Confirma tu asistencia al instante{' '}
              <span className="inline-flex items-center gap-1 text-evently-text font-semibold">
                <Watch className="w-4 h-4 text-evently-primary" />
                desde tu smartwatch
              </span>
              .
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-12"
            >
              <motion.a
                href="#eventos"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="btn-emerald group px-8 py-4 rounded-2xl text-base inline-flex items-center justify-center gap-2"
              >
                Explorar eventos
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-500" />
              </motion.a>
              <motion.a
                href="#como-funciona"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="btn-outline px-8 py-4 rounded-2xl text-base inline-flex items-center justify-center gap-2.5"
              >
                <Watch className="w-5 h-5 text-evently-primary" />
                Conectar smartwatch
              </motion.a>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex items-center gap-2 text-evently-primary font-medium text-sm"
            >
              <BadgeCheck className="w-4 h-4" />
              100% gratuito
            </motion.div>
          </motion.div>

          {/* Hero image */}
          <motion.div
            style={{ y: imgY }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.35, ease: EASE }}
            className="relative"
            onMouseEnter={() => setHeroPaused(true)}
            onMouseLeave={() => setHeroPaused(false)}
          >
            <div className="relative rounded-[2rem] overflow-hidden shadow-elevated border border-evently-border/60">
              <AnimatePresence mode="wait">
                <motion.img
                  key={heroEvent.id}
                  src={heroEvent.image}
                  alt={heroEvent.title}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: EASE }}
                  className="w-full aspect-[4/5] sm:aspect-[5/6] object-cover"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-evently-bg/90 via-transparent to-transparent" />

              {/* Floating stat card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6, ease: EASE }}
                className="absolute bottom-6 left-6 right-6 glass-strong rounded-2xl p-4 sm:p-5 overflow-hidden"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={heroEvent.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-evently-muted mb-1">Próximo evento</p>
                      <p className="font-bold text-evently-text text-sm sm:text-base leading-tight truncate">
                        {heroEvent.title}
                      </p>
                      <p className="text-xs text-evently-textSecondary mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-evently-primary flex-shrink-0" />
                        <span className="truncate">{heroEvent.date} · {heroEvent.location.split('·')[0]}</span>
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0 glow-emerald">
                      <Ticket className="w-5 h-5 text-white" />
                    </div>
                  </motion.div>
                </AnimatePresence>
                <div className="flex gap-1 mt-3">
                  {events.map((e, i) => (
                    <button
                      key={e.id}
                      onClick={() => goToHeroEvent(i)}
                      aria-label={`Ver ${e.title}`}
                      className="h-1 rounded-full flex-1 overflow-hidden bg-evently-border"
                    >
                      {i === heroEventIdx && !heroPaused && !reduced ? (
                        <motion.span
                          key={heroProgressKey}
                          className="block h-full rounded-full bg-evently-primary animate-carousel-progress"
                        />
                      ) : (
                        <span
                          className={`block h-full rounded-full transition-colors duration-500 ${
                            i === heroEventIdx ? 'bg-evently-primary' : 'bg-transparent hover:bg-evently-primary/30'
                          }`}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Decorative ring — Nothing aesthetic */}
            <div className="absolute -z-10 -top-6 -right-6 w-32 h-32 rounded-full border border-evently-border/80" />
            <div className="absolute -z-10 -bottom-4 -left-4 w-20 h-20 rounded-full border border-evently-primary/20" />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:block"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-5 h-9 rounded-full border border-evently-border flex justify-center pt-2"
        >
          <div className="w-0.5 h-1.5 rounded-full bg-evently-primary" />
        </motion.div>
      </motion.div>
    </section>
  )
}

function formatEventsBadge(count) {
  if (count >= 1000) {
    const k = count / 1000
    const label = Number.isInteger(k) ? `${k}k` : `${k.toFixed(1).replace('.0', '')}k`
    return `${label} eventos`
  }
  return `${count.toLocaleString('es-MX')} eventos`
}

function CategoryCard({ cat, isActive, onClick }) {
  const Icon = cat.icon
  return (
    <button
      type="button"
      onClick={onClick}
      className={`category-card group relative w-[11.5rem] sm:w-[13.5rem] min-h-[15.5rem] p-6 sm:p-7 flex flex-col cursor-pointer ${
        isActive ? 'category-card-featured' : ''
      }`}
    >
      <div className="category-icon-ring mb-8 group-hover:scale-105 transition-transform duration-500">
        <Icon className="w-8 h-8 text-white" strokeWidth={2} />
      </div>
      <div className="mt-auto">
        <h3 className="text-lg sm:text-xl font-bold text-evently-text mb-1.5 tracking-tight group-hover:text-category-accent transition-colors duration-500">
          {cat.name}
        </h3>
        <p className="text-sm text-evently-muted font-medium">
          {cat.count.toLocaleString('es-MX')} eventos
        </p>
      </div>
    </button>
  )
}

function CategoriesCarousel({ onSelectCategory }) {
  const { categories, loading } = useEventData()
  const [active, setActive] = useState(0)
  const isMobile = useIsMobile()
  const containerRef = useRef(null)
  const total = categories.length

  const goTo = useCallback((index) => {
    if (!total) return
    setActive(((index % total) + total) % total)
  }, [total])

  const goNext = useCallback(() => goTo(active + 1), [active, goTo])
  const goPrev = useCallback(() => goTo(active - 1), [active, goTo])

  useEffect(() => {
    const handler = (e) => {
      const hovered = containerRef.current?.matches(':hover')
      const focused = containerRef.current?.contains(document.activeElement)
      if (!hovered && !focused) return
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goPrev])

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -50) goNext()
    else if (info.offset.x > 50) goPrev()
  }

  const getOffset = (index) => {
    let offset = index - active
    if (offset > total / 2) offset -= total
    if (offset < -total / 2) offset += total
    return offset
  }

  if (!total) {
    return (
      <p className="text-center text-evently-muted py-12">
        {loading ? 'Cargando categorías desde MySQL…' : 'No hay categorías disponibles.'}
      </p>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative max-w-7xl mx-auto outline-none"
      tabIndex={0}
      role="region"
      aria-label="Carrusel de categorías"
      aria-roledescription="carrusel"
    >
      <div className="relative h-[17.5rem] sm:h-[18rem] flex items-center justify-center overflow-hidden px-2">
        {categories.map((cat, i) => {
          const offset = getOffset(i)
          const isActive = offset === 0
          const isAdjacent = Math.abs(offset) === 1
          const isVisible = isMobile ? isActive : Math.abs(offset) <= 2
          const isSelectable = isMobile ? isActive : Math.abs(offset) <= 1

          return (
            <motion.div
              key={cat.name}
              drag={isActive ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={isActive ? handleDragEnd : undefined}
              animate={{
                x: isMobile ? 0 : offset * 260,
                scale: isActive ? 1 : isAdjacent ? 0.92 : 0.85,
                opacity: isVisible ? (isActive ? 1 : isAdjacent ? 0.7 : 0.35) : 0,
                zIndex: isActive ? 20 : isAdjacent ? 10 : 0,
              }}
              transition={{ duration: 0.65, ease: EASE }}
              className="absolute flex justify-center"
              style={{ pointerEvents: isSelectable ? 'auto' : 'none' }}
              aria-hidden={!isSelectable}
            >
              <CategoryCard
                cat={cat}
                isActive={isActive}
                onClick={() => onSelectCategory(cat)}
              />
            </motion.div>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-4 mt-4 px-5">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Categoría anterior"
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full glass flex items-center justify-center text-evently-textSecondary hover:text-category-accent hover:shadow-[0_0_24px_rgba(16,185,129,0.15)] transition-all duration-500"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5">
          {categories.map((cat, i) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ir a ${cat.name}`}
              aria-current={i === active ? 'true' : undefined}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === active ? 'w-8 bg-[#10B981]' : 'w-2 bg-evently-border hover:bg-[#10B981]/40'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={goNext}
          aria-label="Siguiente categoría"
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full glass flex items-center justify-center text-evently-textSecondary hover:text-category-accent hover:shadow-[0_0_24px_rgba(16,185,129,0.15)] transition-all duration-500"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <p className="text-center text-xs text-evently-muted mt-3">
        {isMobile ? 'Desliza' : 'Flechas ← →'} para explorar · {active + 1} / {total}
      </p>
    </div>
  )
}

function Categories() {
  const showToast = useToast()

  const handleCategoryClick = (cat) => {
    showToast(`Explorando ${cat.name}…`, 'info')
    setTimeout(() => {
      document.getElementById('eventos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 400)
  }

  return (
    <section id="categorias" className="relative py-24 sm:py-32 bg-evently-bg">
      <div className="section-divider absolute top-0 left-0 right-0" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal className="flex items-start justify-between gap-6 mb-10 sm:mb-12">
          <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-[3.25rem] tracking-[-0.03em] leading-[1.05]">
            <span className="text-evently-text">Explora </span>
            <span className="text-category-accent">por tipo</span>
          </h2>
          <a
            href="#eventos"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-evently-textSecondary hover:text-category-accent transition-colors duration-500 group flex-shrink-0 pt-2"
          >
            Ver todos
            <span className="group-hover:translate-x-0.5 transition-transform duration-500">→</span>
          </a>
        </Reveal>

        <a
          href="#eventos"
          className="sm:hidden inline-flex items-center gap-1.5 text-sm font-semibold text-evently-textSecondary hover:text-category-accent transition-colors duration-500 mb-6"
        >
          Ver todos →
        </a>
      </div>

      <CategoriesCarousel onSelectCategory={handleCategoryClick} />
    </section>
  )
}

/* ============================================================
   4. EVENTOS DESTACADOS · Carrusel premium
   ============================================================ */
const CAROUSEL_INTERVAL_MS = EVENT_ROTATE_MS

function EventCard({ event, isActive = false, onOpen, suppressOpenRef }) {
  const openDetail = () => {
    if (!isActive || !onOpen) return
    if (suppressOpenRef?.current) {
      suppressOpenRef.current = false
      return
    }
    onOpen(event)
  }

  return (
    <article
      className={`group relative card-premium w-full max-w-md mx-auto transition-shadow duration-700 ${
        isActive ? 'shadow-card-hover cursor-pointer' : 'pointer-events-none'
      }`}
      onClick={openDetail}
      role={isActive ? 'button' : undefined}
      tabIndex={isActive ? 0 : undefined}
      onKeyDown={(e) => {
        if (!isActive || !onOpen) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openDetail()
        }
      }}
      aria-label={isActive ? `Ver detalle de ${event.title}` : undefined}
    >
      <div className="relative overflow-hidden h-56 sm:h-64">
        <img
          src={event.image}
          alt={event.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-premium"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-evently-text/50 via-evently-text/5 to-transparent" />

        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase text-white bg-gradient-brand">
            {event.category}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6 bg-white">
        <h3 className="font-display font-bold mb-3 text-evently-text tracking-tight text-lg sm:text-xl group-hover:text-evently-primary transition-colors duration-500">
          {event.title}
        </h3>

        <div className="space-y-2 mb-5 text-sm">
          <div className="flex items-center gap-2 flex-wrap text-evently-textSecondary">
            <Calendar className="w-3.5 h-3.5 text-evently-primary flex-shrink-0" />
            <span>{event.date}</span>
            <Clock className="w-3.5 h-3.5 text-evently-primary ml-1 flex-shrink-0" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-2 text-evently-textSecondary">
            <MapPin className="w-3.5 h-3.5 text-evently-primary flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-5 pt-4 border-t border-evently-border/80">
          <p className="text-xs text-evently-muted">Toca para ver detalle</p>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-evently-muted mb-0.5">Cupos</p>
            <p className="font-semibold text-evently-textSecondary text-sm">{event.spots} disponibles</p>
          </div>
        </div>

        {isActive && (
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm btn-cta flex items-center justify-center gap-2 pointer-events-none"
          >
            Ver evento
            <ArrowRight className="w-4 h-4" />
          </motion.div>
        )}
      </div>
    </article>
  )
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [breakpoint])

  return isMobile
}

function EventsCarousel({ onOpenEvent }) {
  const { events, loading } = useEventData()
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [progressKey, setProgressKey] = useState(0)
  const isMobile = useIsMobile()
  const reduced = usePrefersReducedMotion()
  const containerRef = useRef(null)
  const suppressOpenRef = useRef(false)
  const total = events.length

  const goTo = useCallback((index) => {
    if (!total) return
    setActive(((index % total) + total) % total)
    setProgressKey((k) => k + 1)
  }, [total])

  const goNext = useCallback(() => goTo(active + 1), [active, goTo])
  const goPrev = useCallback(() => goTo(active - 1), [active, goTo])

  useEffect(() => {
    if (paused || reduced || total < 2) return
    const id = setInterval(() => {
      setActive((a) => (a + 1) % total)
      setProgressKey((k) => k + 1)
    }, CAROUSEL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [paused, reduced, total])

  useEffect(() => {
    const handler = (e) => {
      const hovered = containerRef.current?.matches(':hover')
      const focused = containerRef.current?.contains(document.activeElement)
      if (!hovered && !focused) return
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goPrev])

  const handleDragStart = () => {
    suppressOpenRef.current = false
  }

  const handleDrag = (_, info) => {
    if (Math.abs(info.offset.x) > 8) suppressOpenRef.current = true
  }

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -60) goNext()
    else if (info.offset.x > 60) goPrev()
  }

  const getOffset = (index) => {
    let offset = index - active
    if (offset > total / 2) offset -= total
    if (offset < -total / 2) offset += total
    return offset
  }

  if (!total) {
    return (
      <p className="text-center text-evently-muted py-16">
        {loading ? 'Cargando eventos desde MySQL…' : 'No hay eventos disponibles.'}
      </p>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative outline-none"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false)
      }}
      role="region"
      aria-label="Carrusel de eventos destacados"
      aria-roledescription="carrusel"
      aria-live="polite"
    >
      <div className="relative h-[540px] sm:h-[560px] flex items-center justify-center overflow-hidden touch-pan-y">
        {events.map((event, i) => {
          const offset = getOffset(i)
          const isActive = offset === 0
          const isAdjacent = Math.abs(offset) === 1

          return (
            <motion.div
              key={event.id}
              drag={isActive ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              onDragStart={isActive ? handleDragStart : undefined}
              onDrag={isActive ? handleDrag : undefined}
              onDragEnd={isActive ? handleDragEnd : undefined}
              animate={{
                x: isMobile ? 0 : offset * 340,
                scale: isActive ? 1 : isAdjacent ? 0.88 : 0.78,
                opacity: isActive ? 1 : isMobile ? 0 : isAdjacent ? 0.45 : 0,
                zIndex: isActive ? 20 : isAdjacent ? 10 : 0,
                filter: isActive ? 'blur(0px)' : 'blur(2px)',
              }}
              transition={{ duration: 0.75, ease: EASE }}
              className="absolute w-[calc(100%-2rem)] sm:w-full max-w-md px-2 cursor-grab active:cursor-grabbing"
              style={{ pointerEvents: isActive ? 'auto' : 'none' }}
              aria-hidden={!isActive}
            >
              <EventCard
                event={event}
                isActive={isActive}
                onOpen={onOpenEvent}
                suppressOpenRef={suppressOpenRef}
              />
            </motion.div>
          )
        })}
      </div>

      {/* Controles */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <button
          onClick={goPrev}
          aria-label="Evento anterior"
          className="w-11 h-11 rounded-full glass flex items-center justify-center text-evently-textSecondary hover:text-evently-primary hover:shadow-glow transition-all duration-500"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          {events.map((event, i) => (
            <button
              key={event.id}
              onClick={() => goTo(i)}
              aria-label={`Ir a ${event.title}`}
              aria-current={i === active ? 'true' : undefined}
              className="relative h-6 flex items-center"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-500 overflow-hidden ${
                  i === active ? 'w-10 bg-evently-border' : 'w-2 bg-evently-border hover:bg-evently-primary/40'
                }`}
              >
                {i === active && !paused && !reduced && (
                  <motion.span
                    key={progressKey}
                    className="block h-full rounded-full bg-evently-primary animate-carousel-progress"
                  />
                )}
                {i === active && (paused || reduced) && (
                  <span className="block h-full w-full rounded-full bg-evently-primary" />
                )}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={goNext}
          aria-label="Siguiente evento"
          className="w-11 h-11 rounded-full glass flex items-center justify-center text-evently-textSecondary hover:text-evently-primary hover:shadow-glow transition-all duration-500"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <p className="text-center text-xs text-evently-muted mt-4">
        {paused ? 'Pausado' : 'Avance automático cada 4 s'}
        {' · '}
        {isMobile ? 'Desliza' : 'Flechas ← →'} para navegar · {active + 1} / {total}
      </p>
    </div>
  )
}

function FeaturedEvents({ onOpenEvent }) {
  return (
    <section id="eventos" className="relative py-24 sm:py-32 bg-evently-surface/40">
      <div className="section-divider absolute top-0 left-0 right-0" />
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, ease: EASE }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12"
        >
          <div>
            <span className="section-label mb-4 block">
              <span className="nothing-dot" />
              Destacados
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl tracking-[-0.02em] text-evently-text">
              Eventos{' '}
              <span className="text-gradient">cerca de ti</span>
            </h2>
            <p className="text-evently-muted text-sm mt-4 inline-flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-evently-primary" />
              Imagen, fecha y lugar — al instante
            </p>
          </div>
        </motion.div>

        <EventsCarousel onOpenEvent={onOpenEvent} />
      </div>
    </section>
  )
}

/** Pantalla protegida: solo accesible autenticado (Práctica 11/12) */
function MyEventsSection({ onOpenAuth, onOpenEvent }) {
  const { isAuthenticated, user } = useAuth()
  const { events } = useEventData()
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      setEventos([])
      setError('')
      return
    }
    let cancelled = false
    const loadReservations = async () => {
      setLoading(true)
      setError('')
      const data = await apiMisEventos()
      if (cancelled) return
      if (data.ok) setEventos(data.eventos || [])
      else setError(data.error || 'No se pudieron cargar tus eventos.')
      setLoading(false)
    }

    loadReservations()
    window.addEventListener('evently:reservations-changed', loadReservations)
    return () => {
      cancelled = true
      window.removeEventListener('evently:reservations-changed', loadReservations)
    }
  }, [isAuthenticated])

  const openReservation = (reservation) => {
    const full =
      events.find((e) => e.id === reservation.id) ||
      {
        id: reservation.id,
        title: reservation.titulo || reservation.title,
        category: reservation.categoria || reservation.category || 'Evento',
        date: reservation.date
          || (reservation.fecha_inicio
          ? new Date(reservation.fecha_inicio).toLocaleDateString('es-MX', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : 'Fecha por confirmar'),
        time: reservation.time
          || (reservation.fecha_inicio
          ? new Date(reservation.fecha_inicio).toLocaleTimeString('es-MX', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
          : '--:--'),
        location: reservation.ubicacion || reservation.location || 'Querétaro',
        description: 'Reserva confirmada en Evently.',
        image: reservation.imagen_url,
        spots: 0,
        confirmed: true,
      }
    onOpenEvent?.({ ...full, confirmed: true })
  }

  return (
    <section id="mis-eventos" className="relative py-24 sm:py-32 bg-evently-bg">
      <div className="section-divider absolute top-0 left-0 right-0" />
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal className="mb-10">
          <span className="section-label mb-4 block">
            <span className="nothing-dot" />
            Área privada
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl tracking-[-0.02em] text-evently-text">
            Mis <span className="text-gradient">eventos</span>
          </h2>
          <p className="text-evently-muted text-sm mt-3 max-w-xl">
            Esta sección requiere autenticación. Sin sesión válida el servidor responde 401.
          </p>
        </Reveal>

        {!isAuthenticated ? (
          <div className="rounded-[20px] bg-white border border-evently-border/60 shadow-soft p-8 sm:p-12 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#10B981]/10 flex items-center justify-center mx-auto mb-5">
              <Lock className="w-6 h-6 text-[#10B981]" />
            </div>
            <h3 className="font-display font-bold text-xl text-evently-text mb-2">
              Acceso restringido
            </h3>
            <p className="text-evently-muted text-sm mb-6 leading-relaxed">
              Inicia sesión o regístrate para ver tus reservas. Las credenciales se validan
              en Express y se almacenan hasheadas en MySQL (Laragon).
            </p>
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="btn-emerald px-6 py-3 rounded-full text-sm inline-flex items-center gap-2"
            >
              Iniciar sesión
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-[20px] bg-white border border-[#10B981]/25 p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-soft">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#10B981] font-bold mb-1">
                  Sesión activa
                </p>
                <p className="font-semibold text-evently-text">{user?.name}</p>
                <p className="text-sm text-evently-muted">{user?.email}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#10B981] bg-[#10B981]/10 px-3 py-1.5 rounded-full border border-[#10B981]/20">
                <BadgeCheck className="w-3.5 h-3.5" />
                JWT verificado
              </span>
            </div>

            {loading && (
              <p className="text-evently-muted text-sm flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" />
                Cargando reservas…
              </p>
            )}
            {error && (
              <p className="text-evently-energy text-sm">{error}</p>
            )}
            {!loading && !error && eventos.length === 0 && (
              <div className="rounded-[20px] border border-dashed border-evently-border bg-evently-surface/40 p-8 text-center">
                <Ticket className="w-8 h-8 text-evently-muted mx-auto mb-3" />
                <p className="text-evently-text font-medium mb-1">Aún no tienes reservas</p>
                <p className="text-evently-muted text-sm">
                  Explora eventos y confirma asistencia. Tu sesión ya está protegida.
                </p>
                <a
                  href="#eventos"
                  className="inline-flex mt-4 text-sm font-semibold text-[#10B981] hover:underline"
                >
                  Ver eventos →
                </a>
              </div>
            )}
            {eventos.length > 0 && (
              <ul className="grid sm:grid-cols-2 gap-4">
                {eventos.map((ev) => (
                  <li key={ev.reserva_id || ev.id}>
                    <button
                      type="button"
                      onClick={() => openReservation(ev)}
                      className="w-full text-left rounded-2xl bg-white border border-evently-border/60 p-5 shadow-soft hover:border-[#10B981]/40 hover:shadow-elevated transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-evently-text group-hover:text-[#10B981] transition-colors">
                            {ev.titulo || ev.title || 'Evento'}
                          </p>
                          <p className="text-sm text-evently-muted mt-1">
                            {ev.date && ev.time
                              ? `${ev.date} · ${ev.time}`
                              : ev.fecha_inicio
                                ? new Date(ev.fecha_inicio).toLocaleString('es-MX', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false,
                                  })
                                : 'Fecha por confirmar'}
                          </p>
                          <span className="inline-block mt-3 text-[10px] font-bold uppercase tracking-wider text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full">
                            {(ev.estado || 'confirmada').toString().toUpperCase()}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-evently-muted group-hover:text-[#10B981] flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

/* ============================================================
   5. CÓMO FUNCIONA
   ------------------------------------------------------------
   4 pasos enfocados en el reloj inteligente.
   ============================================================ */
const STEPS = [
  {
    icon: Search,
    title: 'Descubre',
    description:
      'Explora cientos de eventos gratuitos cerca de ti: fiestas, charlas, festivales y más.',
  },
  {
    icon: Heart,
    title: 'Guarda los que te gusten',
    description:
      'Marca como favoritos los que te llaman la atención. Recibirás recordatorios.',
  },
  {
    icon: Watch,
    title: 'Confirma desde tu reloj',
    description:
      'Recibe la notificación en tu smartwatch y confirma tu asistencia con un solo toque.',
    highlight: true, // paso clave
  },
  {
    icon: Ticket,
    title: 'Asiste sin pagar nada',
    description:
      'Llega al evento y muestra tu pase digital. Cero filas, cero papel, cero costos.',
  },
]

function HowItWorks() {
  const [hoveredStep, setHoveredStep] = useState(null)

  return (
    <section
      id="como-funciona"
      className="relative py-24 sm:py-32 overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[140px] -z-10 pointer-events-none bg-evently-primary/6" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.65, ease: EASE }}
          className="text-center mb-20"
        >
          <span className="section-label mb-4 justify-center">
            <span className="nothing-dot" />
            Cómo funciona
          </span>
          <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-[-0.02em] mb-5 text-evently-text">
            En <span className="text-gradient">4 pasos</span>
          </h2>
          <p className="text-evently-textSecondary text-lg max-w-xl mx-auto leading-relaxed">
            Asistir a un evento es tan simple como mirar tu muñeca.
            Sin pagos, sin filas, sin estrés.
          </p>
        </motion.div>

        <div className="relative">
          <div className="hidden lg:block absolute top-14 left-[14%] right-[14%] h-px section-divider" />

          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 relative"
            onMouseLeave={() => setHoveredStep(null)}
          >
            {STEPS.map((step, i) => {
              const Icon = step.icon
              const isActive = hoveredStep !== null ? i === hoveredStep : step.highlight
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.65, delay: i * 0.12, ease: EASE }}
                  onMouseEnter={() => setHoveredStep(i)}
                  className={`relative text-center group rounded-3xl p-4 transition-all duration-700 ${
                    isActive ? 'bg-white/60 shadow-soft border border-evently-primary/15' : ''
                  }`}
                >
                  <div className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[7rem] font-display font-black select-none pointer-events-none leading-none transition-colors duration-700 ${
                    isActive ? 'text-evently-primary/15' : 'text-evently-border/60'
                  }`}>
                    0{i + 1}
                  </div>

                  <div className="relative inline-flex mb-7">
                    <motion.div
                      animate={{ scale: isActive ? 1.08 : 1 }}
                      transition={{ duration: 0.5, ease: EASE }}
                      className={`relative w-20 h-20 rounded-2xl flex items-center justify-center transition-shadow duration-700 ${
                        step.highlight || isActive
                          ? 'bg-gradient-brand shadow-glow'
                          : 'bg-evently-surface border border-evently-border group-hover:border-evently-primary/30 group-hover:shadow-glow'
                      }`}
                    >
                      <Icon className={`w-9 h-9 ${step.highlight || isActive ? 'text-white' : 'text-evently-text'}`} />
                    </motion.div>
                    <motion.div
                      animate={{ scale: isActive ? 1.15 : 1 }}
                      className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-white border-2 border-evently-primary flex items-center justify-center shadow-soft"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-evently-primary" />
                    </motion.div>
                  </div>

                  <h3 className="font-display font-bold text-lg mb-3 text-evently-text tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-evently-textSecondary text-sm leading-relaxed px-2">
                    {step.description}
                  </p>

                  {step.highlight && (
                    <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-evently-primary/10 text-evently-primary border border-evently-primary/20">
                      <Zap className="w-3 h-3" />
                      Función estrella
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   6. CTA SMARTWATCH
   ------------------------------------------------------------
   Bloque promocional del wearable con ilustración estilizada.
   ============================================================ */
function SmartwatchCTA() {
  const showToast = useToast()
  const { isAuthenticated } = useAuth()
  const { events, refresh } = useEventData()
  const [confirmed, setConfirmed] = useState(false)
  const [pulse, setPulse] = useState(false)
  const [busy, setBusy] = useState(false)
  const smartwatchEvent =
    events.find((event) => event.title.includes('IA')) || events[0]

  const handleWatchConfirm = async () => {
    if (!isAuthenticated) {
      showToast('Inicia sesión para confirmar desde tu smartwatch.', 'info')
      return
    }
    if (!smartwatchEvent) {
      showToast('No hay un evento disponible para confirmar.', 'info')
      return
    }

    setBusy(true)
    const result = await apiReserveEvent(smartwatchEvent.id)
    setBusy(false)
    if (!result.ok) {
      showToast(result.error || 'No se pudo confirmar la asistencia.', 'info')
      return
    }

    setConfirmed(Boolean(result.confirmed))
    setPulse(true)
    showToast('¡Asistencia confirmada desde tu smartwatch!', 'success')
    await refresh()
    window.dispatchEvent(new Event('evently:reservations-changed'))
    setTimeout(() => setPulse(false), 600)
  }

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.75, ease: EASE }}
          className="relative rounded-[2rem] overflow-hidden glass-strong border border-evently-border/80"
        >
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-evently-primary/5 via-transparent to-evently-secondary/8" />
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-[100px] pointer-events-none bg-evently-primary/10" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-[100px] pointer-events-none bg-evently-energy/8" />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 p-8 sm:p-12 lg:p-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 mb-7">
                <Zap className="w-3.5 h-3.5 text-evently-primary" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-evently-textSecondary">
                  Smart Devices
                </span>
              </div>

              <h2 className="font-display font-black text-4xl sm:text-5xl tracking-[-0.02em] mb-6 leading-[1.05] text-evently-text">
                Tu próximo evento,
                <br />
                <span className="text-gradient">a un toque</span>
              </h2>

              <p className="text-evently-textSecondary text-base sm:text-lg mb-8 leading-relaxed max-w-md">
                Compatible con Apple Watch, Wear OS y Garmin. Recibe recordatorios
                y confirma tu asistencia con un solo toque — sin abrir la app.
              </p>

              <div className="flex flex-wrap gap-2 mb-10">
                {['Apple Watch', 'Wear OS', 'Garmin', 'Fitbit'].map((d) => (
                  <span
                    key={d}
                    className="glass rounded-full px-4 py-2 text-xs font-semibold text-evently-textSecondary"
                  >
                    {d}
                  </span>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => showToast('Próximamente en App Store y Google Play', 'info')}
                className="btn-primary inline-flex items-center gap-2 px-7 py-4 rounded-2xl"
              >
                Descargar app
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="relative h-80 sm:h-96 flex items-center justify-center">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative"
              >
                <div className="absolute inset-0 blur-[60px] scale-90 opacity-50 bg-evently-primary rounded-full" />

                <div className="relative w-60 h-72 sm:w-64 sm:h-80 rounded-[2.5rem] shadow-elevated p-5 flex flex-col border border-evently-border bg-evently-text">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-2.5 rounded-t-lg bg-evently-textSecondary/40" />
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-28 h-2.5 rounded-b-lg bg-evently-textSecondary/40" />

                  <div className="flex-1 rounded-[1.75rem] p-5 flex flex-col justify-between bg-gradient-to-br from-evently-primary/90 via-evently-secondary/80 to-evently-primary/70">
                    <div className="flex justify-between items-start">
                      <div className="text-xs text-white/70 font-medium">12:42</div>
                      <BellRing className="w-4 h-4 text-white/90" />
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-widest mb-1 font-bold text-white/80 inline-flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3" />
                        Evently · Gratis
                      </div>
                      <div className="text-white font-bold text-sm mb-4 leading-tight">
                        {smartwatchEvent?.title || 'Próximo evento'} · recordatorio
                      </div>

                      <div className="flex gap-2">
                        <motion.button
                          onClick={handleWatchConfirm}
                          disabled={busy || confirmed}
                          animate={pulse ? { scale: [1, 1.05, 1] } : {}}
                          className={`flex-1 py-2 rounded-full text-white text-xs font-bold border transition-all duration-500 ${
                            confirmed
                              ? 'bg-white/30 border-white/50'
                              : 'bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30'
                          }`}
                        >
                          {busy ? 'Guardando…' : confirmed ? '✓ Confirmado' : 'Confirmar'}
                        </motion.button>
                        <button
                          onClick={() => showToast('Recordatorio pospuesto 15 min', 'info')}
                          className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center border border-white/20 hover:bg-white/25 transition-colors"
                          aria-label="Posponer"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ============================================================
   7. FOOTER
   ------------------------------------------------------------
   Contacto + políticas (modal) + redes.
   ============================================================ */

const POLICIES = {
  terminos: {
    title: 'Términos y condiciones',
    sections: [
      {
        heading: '1. Aceptación',
        body: 'Al usar Evently aceptas estos términos. La plataforma conecta personas con eventos gratuitos en Querétaro y zona metropolitana.',
      },
      {
        heading: '2. Uso del servicio',
        body: 'Evently es gratuito. Puedes explorar eventos, reservar lugares y recibir notificaciones en tu smartwatch. No está permitido usar la plataforma con fines fraudulentos o para publicar eventos falsos.',
      },
      {
        heading: '3. Reservas y asistencia',
        body: 'Las reservas confirman tu intención de asistir. Si no podrás ir, libera tu lugar para que otra persona lo use. Evently no se hace responsable de cambios de última hora organizados por terceros.',
      },
      {
        heading: '4. Propiedad intelectual',
        body: 'El contenido, marca y diseño de Evently están protegidos. No puedes copiar ni redistribuir el servicio sin autorización escrita.',
      },
    ],
  },
  privacidad: {
    title: 'Política de privacidad',
    sections: [
      {
        heading: '1. Datos que recopilamos',
        body: 'Recopilamos tu correo electrónico al suscribirte o reservar, datos de uso anónimos y preferencias de eventos para mejorar recomendaciones.',
      },
      {
        heading: '2. Uso de la información',
        body: 'Usamos tus datos para gestionar reservas, enviar recordatorios y mejorar la experiencia. No vendemos tu información personal a terceros.',
      },
      {
        heading: '3. Almacenamiento y seguridad',
        body: 'Tus datos se almacenan en servidores seguros. Aplicamos medidas técnicas razonables para proteger la información contra accesos no autorizados.',
      },
      {
        heading: '4. Tus derechos',
        body: 'Puedes solicitar acceso, corrección o eliminación de tus datos escribiendo a eventrly@gmail.com. Responderemos en un plazo máximo de 30 días hábiles.',
      },
    ],
  },
  cookies: {
    title: 'Política de cookies',
    sections: [
      {
        heading: '1. Qué son las cookies',
        body: 'Las cookies son archivos pequeños que guardan preferencias en tu navegador para que Evently recuerde tu sesión y configuración.',
      },
      {
        heading: '2. Cookies que usamos',
        body: 'Utilizamos cookies esenciales (funcionamiento del sitio), de preferencias (idioma, tema) y analíticas anónimas para entender cómo se usa la plataforma.',
      },
      {
        heading: '3. Control',
        body: 'Puedes desactivar las cookies desde la configuración de tu navegador. Algunas funciones del sitio podrían dejar de funcionar correctamente.',
      },
    ],
  },
}

function PoliciesModal({ open, onClose, activePolicy }) {
  const policy = POLICIES[activePolicy] || POLICIES.terminos

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
          <motion.div
            onClick={onClose}
            className="absolute inset-0 bg-evently-text/20 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.96, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 16, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            role="dialog"
            aria-label={policy.title}
            className="relative w-full max-w-2xl glass-strong rounded-3xl overflow-hidden shadow-elevated max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-evently-border/80 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-display font-bold text-evently-text truncate">
                  {policy.title}
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar políticas"
                className="w-9 h-9 rounded-full glass flex items-center justify-center text-evently-muted hover:text-evently-text transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-6 space-y-6 scroll-smooth-hide">
              {policy.sections.map((section) => (
                <div key={section.heading}>
                  <h4 className="text-evently-text font-semibold mb-2 text-sm">
                    {section.heading}
                  </h4>
                  <p className="text-evently-textSecondary text-sm leading-relaxed">
                    {section.body}
                  </p>
                </div>
              ))}
              <p className="text-evently-muted text-xs pt-2 border-t border-evently-border/80">
                Última actualización: julio 2026 · Evently · Querétaro, México
              </p>
            </div>

            <div className="flex items-center justify-end px-5 py-3 border-t border-evently-border/80 flex-shrink-0 bg-evently-surface/50">
              <button
                onClick={onClose}
                className="btn-emerald px-5 py-2 rounded-full text-sm"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Footer() {
  const [policiesOpen, setPoliciesOpen] = useState(false)
  const [activePolicy, setActivePolicy] = useState('terminos')

  const policyLinks = [
    { id: 'terminos', label: 'Términos y condiciones' },
    { id: 'privacidad', label: 'Política de privacidad' },
    { id: 'cookies', label: 'Política de cookies' },
  ]

  const openPolicy = (id) => {
    setActivePolicy(id)
    setPoliciesOpen(true)
  }

  const socials = [
    { icon: Instagram, label: 'Instagram' },
    { icon: Twitter,   label: 'Twitter' },
    { icon: Facebook,  label: 'Facebook' },
    { icon: Youtube,   label: 'Youtube' },
  ]

  return (
    <>
    <footer className="relative border-t border-evently-border/80 bg-evently-surface/30">
      <div className="section-divider absolute top-0 left-0 right-0" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <a href="#inicio" className="inline-flex mb-6 group">
              <EventlyLogo
                variant="light"
                className="h-11 sm:h-12 w-auto group-hover:opacity-90 transition-opacity duration-500"
              />
            </a>

            <p className="text-evently-textSecondary text-sm leading-relaxed max-w-md mb-6">
              La plataforma que conecta personas con eventos gratuitos en Querétaro:
              fiestas, festivales, charlas y meetups. Confirma desde tu reloj.
            </p>

            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 border border-evently-primary/25 bg-evently-primary/8 text-xs font-bold text-evently-primary">
              <BadgeCheck className="w-4 h-4" />
              100% gratis · Siempre
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col sm:flex-row justify-end gap-12">
            <div>
              <h4 className="font-bold text-evently-text mb-4 text-xs uppercase tracking-widest">
                Contacto
              </h4>
              <a
                href="mailto:eventrly@gmail.com"
                className="inline-flex items-center gap-3 text-evently-textSecondary hover:text-evently-primary transition-colors duration-500 group"
              >
                <div className="w-10 h-10 rounded-full glass flex items-center justify-center group-hover:shadow-glow transition-all duration-500">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-sm">eventrly@gmail.com</span>
              </a>
            </div>

            <div>
              <h4 className="font-bold text-evently-text mb-4 text-xs uppercase tracking-widest">
                Políticas
              </h4>
              <ul className="space-y-3">
                {policyLinks.map((link) => (
                  <li key={link.id}>
                    <button
                      type="button"
                      onClick={() => openPolicy(link.id)}
                      className="text-evently-textSecondary hover:text-evently-text text-sm transition-colors duration-500 flex items-center gap-2 group"
                    >
                      <FileText className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:text-evently-primary transition-all duration-500" />
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-evently-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-evently-muted text-sm">
            © {new Date().getFullYear()} Evently · Querétaro, México
          </p>
          <div className="flex items-center gap-2">
            {socials.map((s) => {
              const Icon = s.icon
              return (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-10 h-10 rounded-full glass flex items-center justify-center text-evently-muted hover:text-evently-primary hover:shadow-glow transition-all duration-500"
                >
                  <Icon className="w-4 h-4" />
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </footer>

    <PoliciesModal
      open={policiesOpen}
      onClose={() => setPoliciesOpen(false)}
      activePolicy={activePolicy}
    />
    </>
  )
}

/* ============================================================
   8. SEARCH MODAL
   ------------------------------------------------------------
   Buscador interno del sitio. Indexa eventos, categorías, pasos
   y secciones. Soporta navegación por teclado:
     · ⌘/Ctrl + K  → abrir
     · ESC         → cerrar
     · ↑ / ↓       → mover selección
     · Enter       → ir a la sección del resultado
   Diseño premium: barra amplia + panel flotante estilo Notion/Airbnb.
   ============================================================ */

const SEARCH_PREVIEW_STEPS = [STEPS[2], STEPS[0]]

// Secciones navegables del sitio (id = ancla destino).
const SITE_SECTIONS = [
  {
    id: 'inicio',
    title: 'Inicio',
    description: 'Encuentra eventos gratuitos cerca de ti',
    icon: Sparkles,
    keywords: 'inicio home hero principal landing eventos gratuitos cerca',
  },
  {
    id: 'categorias',
    title: 'Categorías',
    description: 'Explora eventos por categoría',
    icon: Palette,
    keywords: 'categorias categorías explorar tipos clasificación',
  },
  {
    id: 'eventos',
    title: 'Eventos destacados',
    description: 'Los eventos gratuitos más populares cerca de ti',
    icon: Ticket,
    keywords: 'eventos destacados populares featured cerca gratis',
  },
  {
    id: 'como-funciona',
    title: 'Cómo funciona',
    description: '4 pasos para asistir a un evento gratis',
    icon: PlayCircle,
    keywords: 'como funciona pasos guía tutorial reloj smartwatch',
  },
]

/**
 * normaliza un texto: minúsculas + sin acentos.
 * Permite buscar "academicos" y encontrar "Académicos".
 */
function normalize(str) {
  return (str || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function SearchModal({ open, onClose, onOpenEvent }) {
  const showToast = useToast()
  const { events, categories, totalEvents } = useEventData()
  const eventsBadge = formatEventsBadge(totalEvents)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const index = useMemo(() => {
    const items = []

    events.forEach((e) => {
      items.push({
        id: `event-${e.id}`,
        type: 'Eventos',
        kind: 'event',
        eventId: e.id,
        title: e.title,
        subtitle: `${e.category} · ${e.date} · ${e.location}`,
        keywords: normalize(
          [e.title, e.category, e.date, e.time, e.location, e.description].join(' ')
        ),
        sectionId: 'eventos',
        icon: Ticket,
        event: e,
      })
    })

    categories.forEach((c) => {
      items.push({
        id: `cat-${c.name}`,
        type: 'Categorías',
        kind: 'category',
        title: c.name,
        subtitle: `${c.count.toLocaleString('es-MX')} eventos`,
        keywords: normalize([c.name, String(c.count), 'eventos'].join(' ')),
        sectionId: 'categorias',
        icon: c.icon,
        count: c.count,
        categoryName: c.name,
      })
    })

    STEPS.forEach((s, i) => {
      items.push({
        id: `step-${i}`,
        type: 'Cómo funciona',
        kind: 'step',
        title: s.title,
        subtitle: s.description,
        keywords: normalize([s.title, s.description].join(' ')),
        sectionId: 'como-funciona',
        icon: s.icon,
      })
    })

    SITE_SECTIONS.forEach((s) => {
      items.push({
        id: `sec-${s.id}`,
        type: 'Secciones',
        kind: 'section',
        title: s.title,
        subtitle: s.description,
        keywords: normalize(`${s.title} ${s.description} ${s.keywords}`),
        sectionId: s.id,
        icon: s.icon,
      })
    })

    return items
  }, [events, categories])

  const defaultItems = useMemo(
    () => [
      ...categories.map((c) => ({
        id: `browse-cat-${c.name}`,
        kind: 'category',
        title: c.name,
        subtitle: `${c.count.toLocaleString('es-MX')} eventos`,
        sectionId: 'eventos',
        icon: c.icon,
        count: c.count,
        categoryName: c.name,
      })),
      ...SEARCH_PREVIEW_STEPS.map((s, i) => ({
        id: `browse-step-${i}`,
        kind: 'step',
        title: s.title,
        subtitle: s.description,
        sectionId: 'como-funciona',
        icon: s.icon,
        highlight: s.highlight,
      })),
    ],
    [categories]
  )

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return []
    const tokens = q.split(/\s+/).filter(Boolean)
    const scored = []
    for (const item of index) {
      let score = 0
      let allMatch = true
      for (const tk of tokens) {
        const idx = item.keywords.indexOf(tk)
        if (idx === -1) {
          allMatch = false
          break
        }
        score += idx === 0 ? 3 : 1
        if (normalize(item.title).startsWith(tk)) score += 5
      }
      if (allMatch) scored.push({ ...item, score })
    }
    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, 20)
  }, [query, index])

  const grouped = useMemo(() => {
    const order = []
    const map = new Map()
    for (const r of results) {
      if (!map.has(r.type)) {
        map.set(r.type, [])
        order.push(r.type)
      }
      map.get(r.type).push(r)
    }
    return order.map((type) => ({ type, items: map.get(type) }))
  }, [results])

  const selectableItems = query.trim() ? results : defaultItems
  const hasQuery = Boolean(query.trim())

  useEffect(() => {
    setActiveIdx(0)
  }, [query])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setActiveIdx(0)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const navigateTo = useCallback(
    (sectionId) => {
      onClose()
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
    },
    [onClose]
  )

  const handleSelect = useCallback(
    (item) => {
      if (item.kind === 'event' || item.event) {
        onClose()
        setTimeout(() => onOpenEvent?.(item.event), 120)
        return
      }
      if (item.kind === 'category') {
        showToast(`Explorando ${item.categoryName}…`, 'info')
        navigateTo(item.sectionId)
        return
      }
      navigateTo(item.sectionId)
    },
    [navigateTo, showToast, onClose, onOpenEvent]
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => Math.min(i + 1, Math.max(selectableItems.length - 1, 0)))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && selectableItems[activeIdx]) {
        e.preventDefault()
        handleSelect(selectableItems[activeIdx])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, selectableItems, activeIdx, handleSelect])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-20 px-4 sm:px-6"
        >
          <motion.div
            onClick={onClose}
            className="absolute inset-0 bg-evently-text/10 backdrop-blur-[6px]"
          />

          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: EASE }}
            role="dialog"
            aria-label="Buscador del sitio"
            className="relative w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra principal */}
            <div className="search-bar-premium flex items-center gap-4 px-5 sm:px-6 py-4 sm:py-5">
              <Search className="w-5 h-5 sm:w-[1.35rem] sm:h-[1.35rem] text-evently-muted flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar eventos, fiestas, festivales..."
                className="flex-1 min-w-0 bg-transparent text-evently-text placeholder:text-evently-muted/80 focus:outline-none text-base sm:text-lg font-medium"
                aria-label="Campo de búsqueda"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Limpiar búsqueda"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-evently-muted hover:text-evently-text hover:bg-evently-surface transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <span className="search-events-badge hidden sm:inline-flex">
                {eventsBadge}
              </span>
            </div>

            {/* Panel de resultados */}
            <div className="search-panel mt-3">
              <div ref={listRef} className="max-h-[min(62vh,520px)] overflow-y-auto scroll-smooth-hide">
                {!hasQuery && (
                  <div className="p-5 sm:p-6">
                    <h3 className="text-sm font-bold text-[#10B981] mb-4 tracking-tight">
                      Categorías
                    </h3>
                    <ul className="space-y-1 mb-8">
                      {categories.map((cat, i) => {
                        const Icon = cat.icon
                        const isActive = activeIdx === i
                        return (
                          <li key={cat.name}>
                            <button
                              type="button"
                              onMouseEnter={() => setActiveIdx(i)}
                              onClick={() => handleSelect(defaultItems[i])}
                              className={`search-category-row group ${isActive ? 'is-active' : ''}`}
                            >
                              <div className="search-icon-ring-sm">
                                <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <p className="font-semibold text-evently-text text-[15px] group-hover:text-[#10B981] transition-colors duration-300">
                                  {cat.name}
                                </p>
                                <p className="text-sm text-evently-muted mt-0.5">
                                  {cat.count.toLocaleString('es-MX')} eventos
                                </p>
                              </div>
                              <ChevronRight
                                className={`search-row-arrow w-4 h-4 flex-shrink-0 transition-all duration-300 ${
                                  isActive
                                    ? 'text-[#10B981] opacity-100 translate-x-0.5'
                                    : 'text-evently-muted/40 opacity-0 group-hover:opacity-100'
                                }`}
                              />
                            </button>
                          </li>
                        )
                      })}
                    </ul>

                    <h3 className="text-sm font-bold text-[#10B981] mb-4 tracking-tight">
                      Cómo funciona
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SEARCH_PREVIEW_STEPS.map((step, i) => {
                        const Icon = step.icon
                        const itemIdx = categories.length + i
                        const isActive = activeIdx === itemIdx
                        return (
                          <button
                            key={step.title}
                            type="button"
                            onMouseEnter={() => setActiveIdx(itemIdx)}
                            onClick={() => handleSelect(defaultItems[itemIdx])}
                            className={`search-step-card group ${isActive ? 'is-active' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                  step.highlight
                                    ? 'bg-[#10B981] shadow-[0_4px_16px_rgba(16,185,129,0.3)]'
                                    : 'bg-evently-surface border border-evently-border'
                                }`}
                              >
                                <Icon
                                  className={`w-5 h-5 ${step.highlight ? 'text-white' : 'text-evently-text'}`}
                                />
                              </div>
                              {step.highlight && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full">
                                  Estrella
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-evently-text text-sm group-hover:text-[#10B981] transition-colors">
                                {step.title}
                              </p>
                              <p className="text-xs text-evently-muted mt-1 leading-relaxed line-clamp-2">
                                {step.description}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {hasQuery && results.length === 0 && (
                  <div className="px-6 py-14 text-center">
                    <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-4 bg-evently-bg border border-evently-border">
                      <Search className="w-6 h-6 text-evently-muted" />
                    </div>
                    <p className="text-evently-text font-semibold mb-1">Sin resultados</p>
                    <p className="text-evently-muted text-sm">
                      No hay coincidencias para &ldquo;{query}&rdquo;
                    </p>
                  </div>
                )}

                {hasQuery &&
                  grouped.map((group) => (
                    <div key={group.type} className="px-4 sm:px-5 py-3">
                      <h3 className="text-sm font-bold text-[#10B981] mb-2 px-2 tracking-tight">
                        {group.type}
                      </h3>
                      <ul className="space-y-1">
                        {group.items.map((item) => {
                          const Icon = item.icon || Sparkles
                          const globalIdx = results.findIndex((r) => r.id === item.id)
                          const isActive = globalIdx === activeIdx
                          return (
                            <li key={item.id}>
                              <button
                                type="button"
                                onMouseEnter={() => setActiveIdx(globalIdx)}
                                onClick={() => handleSelect(item)}
                                className={`search-category-row group ${isActive ? 'is-active' : ''}`}
                              >
                                <div className="search-icon-ring-sm">
                                  <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                  <p className="font-semibold text-evently-text text-[15px] group-hover:text-[#10B981] transition-colors truncate">
                                    {item.title}
                                  </p>
                                  <p className="text-sm text-evently-muted mt-0.5 truncate">
                                    {item.subtitle}
                                  </p>
                                </div>
                                <ChevronRight
                                className={`search-row-arrow w-4 h-4 flex-shrink-0 transition-all duration-300 ${
                                  isActive
                                    ? 'text-[#10B981] opacity-100 translate-x-0.5'
                                    : 'text-evently-muted/40 opacity-0 group-hover:opacity-100'
                                }`}
                              />
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
              </div>

              <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-t border-evently-border/60 bg-evently-bg/40">
                <span className="text-xs text-evently-muted">
                  {hasQuery
                    ? `${results.length} resultado${results.length !== 1 ? 's' : ''}`
                    : `${categories.length} categorías · ${SEARCH_PREVIEW_STEPS.length} atajos`}
                </span>
                <div className="flex items-center gap-3 text-[11px] text-evently-muted">
                  <span className="hidden sm:inline-flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded-md border border-evently-border bg-white text-[10px]">↑</kbd>
                    <kbd className="px-1.5 py-0.5 rounded-md border border-evently-border bg-white text-[10px]">↓</kbd>
                    navegar
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded-md border border-evently-border bg-white text-[10px]">↵</kbd>
                    ir
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded-md border border-evently-border bg-white text-[10px]">esc</kbd>
                    cerrar
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ============================================================
   COMPONENTE PRINCIPAL · LANDING PAGE
   ============================================================ */
function QrLoginCatcher() {
  const { loginWithQr } = useAuth()
  const showToast = useToast()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return undefined
    const params = new URLSearchParams(window.location.search)
    const code = params.get('qr')
    if (!code) return undefined
    started.current = true
    const url = new URL(window.location.href)
    url.searchParams.delete('qr')
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}` || '/')
    loginWithQr(code).then((result) => {
      if (result.ok) showToast('Sesión iniciada en este teléfono', 'success')
      else showToast(result.error || 'No se pudo entrar con el código QR', 'info')
    })
    return undefined
  }, [loginWithQr, showToast])

  return null
}

export default function LandingPage() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [qrOpen, setQrOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(false)

  const openAuth = (mode = 'login') => {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  const openEvent = useCallback((event) => {
    if (!event) return
    setSelectedEvent(event)
  }, [])

  const scrollToEvents = useCallback(() => {
    document.getElementById('eventos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const onBannerVisibilityChange = useCallback((visible) => {
    setBannerVisible(visible)
  }, [])

  // Atajo global ⌘K / Ctrl+K para abrir el buscador desde cualquier parte.
  useEffect(() => {
    const onKey = (e) => {
      const isK = e.key === 'k' || e.key === 'K'
      if (isK && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((v) => !v)
      } else if (e.key === '/' && !searchOpen) {
        // "/" también abre el buscador, siempre que el foco no esté ya en un input
        const tag = (document.activeElement?.tagName || '').toLowerCase()
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault()
          setSearchOpen(true)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [searchOpen])

  const bannerOffset = bannerVisible ? 40 : 0

  return (
    <ToastProvider>
      <QrLoginCatcher />
      <main className="relative bg-evently-bg text-evently-text min-h-screen overflow-hidden">
        <ScrollProgressBar />
        <PromoBanner
          onVisibilityChange={onBannerVisibilityChange}
          onCta={scrollToEvents}
        />
        <Navbar
          onOpenSearch={() => setSearchOpen(true)}
          onOpenAuth={openAuth}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenQr={() => setQrOpen(true)}
          offsetTop={bannerOffset}
        />
        <Hero />
        <Categories />
        <FeaturedEvents onOpenEvent={openEvent} />
        <MyEventsSection onOpenAuth={openAuth} onOpenEvent={openEvent} />
        <HowItWorks />
        <SmartwatchCTA />
        <Footer />
        <BackToTop />
        <PromoPopup onCta={scrollToEvents} />
        <NotificationHost />
        <InstallPrompt />
        <SearchModal
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onOpenEvent={openEvent}
        />
        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          initialMode={authMode}
        />
        <QrSessionModal open={qrOpen} onClose={() => setQrOpen(false)} />
        <ProfileHost
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
        />
        <EventDetailHost
          event={selectedEvent}
          open={Boolean(selectedEvent)}
          onClose={() => setSelectedEvent(null)}
          onOpenAuth={openAuth}
        />
      </main>
    </ToastProvider>
  )
}

function ProfileHost({ open, onClose }) {
  const showToast = useToast()
  return <ProfileModal open={open} onClose={onClose} showToast={showToast} />
}

function NotificationHost() {
  const showToast = useToast()
  return <NotificationPrompt showToast={showToast} />
}

function EventDetailHost({ event, open, onClose, onOpenAuth }) {
  const showToast = useToast()
  return (
    <EventDetailModal
      event={event}
      open={open}
      onClose={onClose}
      onOpenAuth={onOpenAuth}
      showToast={showToast}
    />
  )
}
