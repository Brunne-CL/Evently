import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  User,
  MapPin,
  Phone,
  Mail,
  Lock,
  Watch,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  BadgeCheck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { LOGO_LIGHT } from '../constants/brand.js'

const EASE = [0.16, 1, 0.3, 1]

export default function ProfileModal({ open, onClose, showToast }) {
  const { user, updateProfile, setPin } = useAuth()
  const [tab, setTab] = useState('datos')
  const [profileForm, setProfileForm] = useState({
    name: '',
    ciudad: '',
    telefono: '',
  })
  const [pinForm, setPinForm] = useState({
    pin: '',
    confirmPin: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !user) return
    setTab('datos')
    setError('')
    setSuccess('')
    setShowPassword(false)
    setProfileForm({
      name: user.name || '',
      ciudad: user.ciudad || 'Querétaro',
      telefono: user.telefono || '',
    })
    setPinForm({ pin: '', confirmPin: '', password: '' })
  }, [open, user])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!user) return null

  const notify = (message, type = 'success') => {
    if (typeof showToast === 'function') showToast(message, type)
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const result = await updateProfile(profileForm)
      if (result.ok) {
        setSuccess('Datos guardados correctamente.')
        notify('Perfil actualizado', 'success')
      } else {
        setError(result.error || 'No se pudo guardar el perfil.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePinSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const phoneDigits = String(user?.telefono || profileForm.telefono || '').replace(/\D/g, '')
    if (phoneDigits.length < 7) {
      setError('Primero guarda un número de teléfono en la pestaña Datos.')
      return
    }

    if (pinForm.pin !== pinForm.confirmPin) {
      setError('Los PIN no coinciden.')
      return
    }

    setLoading(true)
    try {
      const result = await setPin({
        pin: pinForm.pin,
        password: pinForm.password,
      })
      if (result.ok) {
        setSuccess(user.hasPin ? 'PIN actualizado.' : 'PIN configurado.')
        setPinForm({ pin: '', confirmPin: '', password: '' })
        notify(user.hasPin ? 'PIN smartwatch actualizado' : 'PIN smartwatch configurado', 'success')
      } else {
        setError(result.error || 'No se pudo guardar el PIN.')
      }
    } finally {
      setLoading(false)
    }
  }

  const hasPhone =
    String(user?.telefono || profileForm.telefono || '').replace(/\D/g, '').length >= 7


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
            onClick={onClose}
            className="absolute inset-0 bg-evently-text/15 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.96, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 16, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            role="dialog"
            aria-modal="true"
            aria-label="Mi perfil"
            className="relative w-full max-w-lg glass-strong rounded-3xl overflow-hidden shadow-elevated max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-evently-border/80 bg-white/90 backdrop-blur-md">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={LOGO_LIGHT}
                  alt="Evently"
                  className="h-10 w-auto object-contain flex-shrink-0"
                  draggable={false}
                />
                <div className="min-w-0">
                  <h3 className="text-lg font-display font-bold text-evently-text">Mi perfil</h3>
                  <p className="text-evently-muted text-xs truncate">
                    Datos personales y PIN del smartwatch
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="w-9 h-9 rounded-full glass flex items-center justify-center text-evently-muted hover:text-evently-text transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pt-4">
              <div className="flex rounded-full glass p-1 mb-4 gap-0.5">
                {[
                  { id: 'datos', label: 'Datos' },
                  { id: 'pin', label: 'PIN' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTab(item.id)
                      setError('')
                      setSuccess('')
                    }}
                    className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
                      tab === item.id
                        ? 'bg-white text-evently-text shadow-soft'
                        : 'text-evently-muted hover:text-evently-text'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5 pb-6 overflow-y-auto flex-1">
              {(error || success) && (
                <div
                  className={`mb-4 flex items-start gap-2 rounded-2xl px-3.5 py-3 text-sm ${
                    error
                      ? 'bg-red-50 text-red-700 border border-red-100'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}
                >
                  {error ? (
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  )}
                  <span>{error || success}</span>
                </div>
              )}

              {tab === 'datos' && (
                <form onSubmit={handleProfileSubmit} className="space-y-3.5">
                  <label className="block">
                    <span className="text-xs font-semibold text-evently-muted uppercase tracking-wider mb-1.5 block">
                      Nombre
                    </span>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-evently-muted" />
                      <input
                        required
                        minLength={2}
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm((f) => ({ ...f, name: e.target.value }))
                        }
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-evently-border bg-white text-sm text-evently-text outline-none focus:border-[#10B981]/50 focus:ring-2 focus:ring-[#10B981]/15"
                        placeholder="Tu nombre"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold text-evently-muted uppercase tracking-wider mb-1.5 block">
                      Correo
                    </span>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-evently-muted" />
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-evently-border bg-evently-bg/80 text-sm text-evently-muted cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[11px] text-evently-muted mt-1.5">
                      El correo no se puede cambiar (es tu identificador de cuenta).
                    </p>
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold text-evently-muted uppercase tracking-wider mb-1.5 block">
                      Ciudad
                    </span>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-evently-muted" />
                      <input
                        required
                        minLength={2}
                        value={profileForm.ciudad}
                        onChange={(e) =>
                          setProfileForm((f) => ({ ...f, ciudad: e.target.value }))
                        }
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-evently-border bg-white text-sm text-evently-text outline-none focus:border-[#10B981]/50 focus:ring-2 focus:ring-[#10B981]/15"
                        placeholder="Querétaro"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold text-evently-muted uppercase tracking-wider mb-1.5 block">
                      Teléfono
                    </span>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-evently-muted" />
                      <input
                        value={profileForm.telefono}
                        onChange={(e) =>
                          setProfileForm((f) => ({
                            ...f,
                            telefono: e.target.value.slice(0, 20),
                          }))
                        }
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-evently-border bg-white text-sm text-evently-text outline-none focus:border-[#10B981]/50 focus:ring-2 focus:ring-[#10B981]/15"
                        placeholder="Opcional"
                      />
                    </div>
                  </label>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full btn-cta py-3.5 rounded-2xl font-semibold text-sm mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Guardando…
                      </>
                    ) : (
                      'Guardar cambios'
                    )}
                  </motion.button>
                </form>
              )}

              {tab === 'pin' && (
                <form onSubmit={handlePinSubmit} className="space-y-3.5">
                  <div className="rounded-2xl bg-evently-bg/80 border border-evently-border/60 p-4 flex items-start gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center flex-shrink-0">
                      <Watch className="w-5 h-5 text-[#10B981]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-evently-text flex items-center gap-1.5">
                        PIN smartwatch
                        {user.hasPin && (
                          <BadgeCheck className="w-4 h-4 text-[#10B981]" />
                        )}
                      </p>
                      <p className="text-xs text-evently-muted mt-1 leading-relaxed">
                        {user.hasPin
                          ? 'Ya tienes un PIN. Puedes cambiarlo confirmando tu contraseña.'
                          : 'Configura un PIN de 4–6 dígitos para entrar desde el reloj con tu teléfono.'}
                      </p>
                    </div>
                  </div>

                  {!hasPhone ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 space-y-3">
                      <p className="text-sm text-amber-900 leading-relaxed">
                        Para tener PIN debes guardar primero un{' '}
                        <strong>número de teléfono</strong> en tu perfil. Es el
                        dato que usa el smartwatch para iniciar sesión.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setTab('datos')
                          setError('')
                          setSuccess('')
                        }}
                        className="w-full btn-primary py-3 rounded-2xl text-sm font-semibold"
                      >
                        Ir a Datos y agregar teléfono
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-evently-muted">
                        Teléfono vinculado:{' '}
                        <span className="font-semibold text-evently-text">
                          {user?.telefono || profileForm.telefono}
                        </span>
                      </p>

                      <label className="block">
                        <span className="text-xs font-semibold text-evently-muted uppercase tracking-wider mb-1.5 block">
                          Nuevo PIN
                        </span>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-evently-muted" />
                          <input
                            required
                            inputMode="numeric"
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
                            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-evently-border bg-white text-sm text-evently-text outline-none focus:border-[#10B981]/50 focus:ring-2 focus:ring-[#10B981]/15 tracking-widest"
                            placeholder="4–6 dígitos"
                          />
                        </div>
                      </label>

                      <label className="block">
                        <span className="text-xs font-semibold text-evently-muted uppercase tracking-wider mb-1.5 block">
                          Confirmar PIN
                        </span>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-evently-muted" />
                          <input
                            required
                            inputMode="numeric"
                            pattern="\d{4,6}"
                            minLength={4}
                            maxLength={6}
                            value={pinForm.confirmPin}
                            onChange={(e) =>
                              setPinForm((f) => ({
                                ...f,
                                confirmPin: e.target.value.replace(/\D/g, '').slice(0, 6),
                              }))
                            }
                            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-evently-border bg-white text-sm text-evently-text outline-none focus:border-[#10B981]/50 focus:ring-2 focus:ring-[#10B981]/15 tracking-widest"
                            placeholder="Repite el PIN"
                          />
                        </div>
                      </label>

                      <label className="block">
                        <span className="text-xs font-semibold text-evently-muted uppercase tracking-wider mb-1.5 block">
                          Contraseña actual
                        </span>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-evently-muted" />
                          <input
                            required
                            type={showPassword ? 'text' : 'password'}
                            value={pinForm.password}
                            onChange={(e) =>
                              setPinForm((f) => ({ ...f, password: e.target.value }))
                            }
                            className="w-full pl-10 pr-11 py-3 rounded-2xl border border-evently-border bg-white text-sm text-evently-text outline-none focus:border-[#10B981]/50 focus:ring-2 focus:ring-[#10B981]/15"
                            placeholder="Confirma tu contraseña"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-evently-muted hover:text-evently-text"
                            aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </label>

                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full btn-cta py-3.5 rounded-2xl font-semibold text-sm mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Guardando…
                          </>
                        ) : user.hasPin ? (
                          'Actualizar PIN'
                        ) : (
                          'Configurar PIN'
                        )}
                      </motion.button>
                    </>
                  )}
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
