import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { apiSendSupport } from '../lib/api.js'

const EMPTY = { name: '', email: '', subject: '', message: '' }
const INPUT =
  'w-full px-4 py-3 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] text-evently-text placeholder-evently-muted'

/** Formulario para reportar un problema con el sitio. El equipo lo ve en el panel de administración. */
export default function SupportModal({ open, onClose }) {
  const { user } = useAuth()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    setError('')
    setSent(false)
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await apiSendSupport({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      })
      if (result.ok) {
        setSent(true)
        setForm(EMPTY)
      } else {
        setError(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6"
        >
          <motion.div onClick={onClose} className="absolute inset-0 bg-evently-text/15 backdrop-blur-md" />

          <motion.div
            initial={{ scale: 0.96, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 16, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Soporte"
            className="relative w-full max-w-md bg-white rounded-3xl border border-evently-border shadow-elevated max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-evently-border/80 sticky top-0 bg-white z-10">
              <div className="min-w-0">
                <h3 className="text-lg font-display font-bold text-evently-text">Soporte</h3>
                <p className="text-evently-muted text-xs">Cuéntanos qué problema tuviste con el sitio</p>
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

            {sent ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle2 className="w-10 h-10 mx-auto text-evently-primary" />
                <p className="mt-4 font-semibold text-evently-text">Recibimos tu reporte</p>
                <p className="mt-1 text-sm text-evently-muted">Nuestro equipo lo revisará pronto.</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 px-6 py-3 rounded-full text-white text-sm font-semibold btn-cta"
                >
                  Listo
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
                {error && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm border bg-evently-energy/8 border-evently-energy/25 text-evently-energy">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {user ? (
                  <p className="text-sm text-evently-muted">
                    Lo enviaremos a nombre de <span className="font-semibold text-evently-text">{user.name}</span> ({user.email}).
                  </p>
                ) : (
                  <>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={100}
                      autoComplete="name"
                      value={form.name}
                      onChange={set('name')}
                      placeholder="Tu nombre"
                      aria-label="Tu nombre"
                      className={INPUT}
                    />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={set('email')}
                      placeholder="Correo electrónico"
                      aria-label="Correo electrónico"
                      className={INPUT}
                    />
                  </>
                )}

                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={150}
                  value={form.subject}
                  onChange={set('subject')}
                  placeholder="Asunto (ej. No puedo confirmar mi asistencia)"
                  aria-label="Asunto"
                  className={INPUT}
                />
                <textarea
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={5}
                  value={form.message}
                  onChange={set('message')}
                  placeholder="¿Qué intentabas hacer y qué pasó?"
                  aria-label="Descripción del problema"
                  className={`${INPUT} resize-y`}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-full text-white text-sm font-semibold btn-cta disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
                    </>
                  ) : (
                    'Enviar reporte'
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
