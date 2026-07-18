import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Watch,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { LOGO_LIGHT } from '../constants/brand.js'

const INITIAL_LOGIN = { email: '', password: '' }
const INITIAL_REGISTER = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  pin: '',
}
const INITIAL_PIN = { email: '', pin: '' }

export default function AuthModal({ open, onClose, initialMode = 'login' }) {
  const { login, register, loginWithPin } = useAuth()
  const [mode, setMode] = useState(initialMode)
  const [loginForm, setLoginForm] = useState(INITIAL_LOGIN)
  const [registerForm, setRegisterForm] = useState(INITIAL_REGISTER)
  const [pinForm, setPinForm] = useState(INITIAL_PIN)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setMode(initialMode)
      setError('')
      setShowPassword(false)
      setShowConfirmPassword(false)
    }
  }, [open, initialMode])

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

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleClose = () => {
    setLoginForm(INITIAL_LOGIN)
    setRegisterForm(INITIAL_REGISTER)
    setPinForm(INITIAL_PIN)
    setError('')
    onClose()
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(loginForm)
      if (result.ok) handleClose()
      else setError(result.error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...registerForm,
        pin: registerForm.pin?.trim() || undefined,
      }
      const result = await register(payload)
      if (result.ok) handleClose()
      else setError(result.error)
    } finally {
      setLoading(false)
    }
  }

  const handlePinLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await loginWithPin(pinForm)
      if (result.ok) handleClose()
      else setError(result.error)
    } finally {
      setLoading(false)
    }
  }

  const titles = {
    login: { h: 'Iniciar sesión', p: 'Accede con tu correo y contraseña' },
    register: { h: 'Crear cuenta', p: 'Únete a Evently · datos en MySQL (Laragon)' },
    pin: { h: 'Acceso smartwatch', p: 'PIN de 4 a 6 dígitos (hasheado)' },
  }
  const t = titles[mode] || titles.login

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
          <motion.div
            onClick={handleClose}
            className="absolute inset-0 bg-evently-text/15 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.96, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 16, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-label={t.h}
            className="relative w-full max-w-md glass-strong rounded-3xl overflow-hidden shadow-elevated max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-evently-border/80 sticky top-0 bg-white/90 backdrop-blur-md z-10">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={LOGO_LIGHT}
                  alt="Evently"
                  className="h-10 w-auto object-contain flex-shrink-0"
                  draggable={false}
                />
                <div className="min-w-0">
                  <h3 className="text-lg font-display font-bold text-evently-text">{t.h}</h3>
                  <p className="text-evently-muted text-xs truncate">{t.p}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                aria-label="Cerrar"
                className="w-9 h-9 rounded-full glass flex items-center justify-center text-evently-muted hover:text-evently-text transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pt-4">
              <div className="flex rounded-full glass p-1 mb-4 gap-0.5">
                {[
                  { id: 'login', label: 'Sesión' },
                  { id: 'register', label: 'Registro' },
                  { id: 'pin', label: 'PIN' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => switchMode(tab.id)}
                    className={`flex-1 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-500 ${
                      mode === tab.id
                        ? 'text-white bg-gradient-brand shadow-glow'
                        : 'text-evently-muted hover:text-evently-text'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-evently-muted mb-4 leading-relaxed">
                Credenciales con <strong className="text-evently-text">bcrypt</strong> en
                Express · MySQL (Laragon). Nunca se guardan en texto plano.
              </p>

              {error && (
                <div className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-xl text-sm border bg-evently-energy/8 border-evently-energy/25 text-evently-energy">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {mode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4 pb-5">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-evently-muted" />
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={loginForm.email}
                      onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="Correo electrónico"
                      className="w-full pl-11 pr-4 py-3 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] text-evently-text placeholder-evently-muted"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-evently-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="Contraseña"
                      className="w-full pl-11 pr-11 py-3 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] text-evently-text placeholder-evently-muted"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-evently-muted"
                      aria-label="Mostrar u ocultar contraseña"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-full text-white text-sm font-semibold btn-cta disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </button>
                </form>
              )}

              {mode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4 pb-5">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-evently-muted" />
                    <input
                      type="text"
                      required
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Nombre completo"
                      className="w-full pl-11 pr-4 py-3 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] text-evently-text placeholder-evently-muted"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-evently-muted" />
                    <input
                      type="email"
                      required
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="Correo electrónico"
                      className="w-full pl-11 pr-4 py-3 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] text-evently-text placeholder-evently-muted"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-evently-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={registerForm.password}
                      onChange={(e) =>
                        setRegisterForm((f) => ({ ...f, password: e.target.value }))
                      }
                      placeholder="Contraseña (mín. 6)"
                      className="w-full pl-11 pr-11 py-3 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] text-evently-text placeholder-evently-muted"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-evently-muted"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-evently-muted" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={registerForm.confirmPassword}
                      onChange={(e) =>
                        setRegisterForm((f) => ({ ...f, confirmPassword: e.target.value }))
                      }
                      placeholder="Confirmar contraseña"
                      className="w-full pl-11 pr-11 py-3 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] text-evently-text placeholder-evently-muted"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-evently-muted"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <Watch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-evently-muted" />
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="\d{4,6}"
                      maxLength={6}
                      value={registerForm.pin}
                      onChange={(e) =>
                        setRegisterForm((f) => ({
                          ...f,
                          pin: e.target.value.replace(/\D/g, '').slice(0, 6),
                        }))
                      }
                      placeholder="PIN smartwatch (opcional, 4–6 dígitos)"
                      className="w-full pl-11 pr-4 py-3 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] text-evently-text placeholder-evently-muted"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-full text-white text-sm font-semibold btn-cta disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Creando...
                      </>
                    ) : (
                      'Crear cuenta'
                    )}
                  </button>
                </form>
              )}

              {mode === 'pin' && (
                <form onSubmit={handlePinLogin} className="space-y-4 pb-5">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-evently-muted" />
                    <input
                      type="email"
                      required
                      value={pinForm.email}
                      onChange={(e) => setPinForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="Correo electrónico"
                      className="w-full pl-11 pr-4 py-3 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] text-evently-text placeholder-evently-muted"
                    />
                  </div>
                  <div className="relative">
                    <Watch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-evently-muted" />
                    <input
                      type="password"
                      inputMode="numeric"
                      required
                      pattern="\d{4,6}"
                      minLength={4}
                      maxLength={6}
                      value={pinForm.pin}
                      onChange={(e) =>
                        setPinForm((f) => ({
                          ...f,
                          pin: e.target.value.replace(/\D/g, '').slice(0, 6),
                        }))
                      }
                      placeholder="PIN (4–6 dígitos)"
                      className="w-full pl-11 pr-4 py-3 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] text-evently-text placeholder-evently-muted tracking-widest"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-full text-white text-sm font-semibold btn-emerald disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Verificando...
                      </>
                    ) : (
                      <>
                        <Watch className="w-4 h-4" /> Entrar con PIN
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
