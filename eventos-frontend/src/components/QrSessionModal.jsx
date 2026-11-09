import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Copy, Loader2, QrCode, RefreshCw, X } from 'lucide-react'
import QRCode from 'qrcode'
import { useAuth } from '../context/AuthContext.jsx'
import { apiCreateQrLogin, apiQrLoginStatus } from '../lib/api.js'
import { buildQrLoginUrl } from '../lib/qrLogin.js'
import { LOGO_LIGHT } from '../constants/brand.js'

const EASE = [0.16, 1, 0.3, 1]

/**
 * Con la sesión ya iniciada en la web, muestra el QR que el teléfono escanea para entrar.
 */
export default function QrSessionModal({ open, onClose }) {
  const { isAuthenticated } = useAuth()
  const [code, setCode] = useState('')
  const [expiresAt, setExpiresAt] = useState(0)
  const [image, setImage] = useState('')
  const [loginUrl, setLoginUrl] = useState('')
  const [status, setStatus] = useState('pending')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const remainingSec = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : 0
  const expired = status === 'expired' || (status !== 'used' && expiresAt > 0 && remainingSec <= 0)

  const issue = useCallback(async () => {
    setLoading(true)
    setError('')
    setCopied(false)
    setStatus('pending')
    setImage('')
    try {
      const data = await apiCreateQrLogin()
      if (!data.ok || !data.code) {
        setCode('')
        setError(data.error || 'No se pudo generar el código.')
        return
      }
      const url = buildQrLoginUrl(data.code)
      const dataUrl = await QRCode.toDataURL(url, {
        margin: 1,
        width: 280,
        errorCorrectionLevel: 'M',
        color: { dark: '#111827', light: '#ffffff' },
      })
      setCode(data.code)
      setExpiresAt(data.expiresAt)
      setLoginUrl(url)
      setImage(dataUrl)
      setNow(Date.now())
    } catch {
      setError('No se pudo dibujar el código QR.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open || !isAuthenticated) return undefined
    issue()
    return undefined
  }, [open, isAuthenticated, issue])

  useEffect(() => {
    if (!open) return undefined
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [open])

  useEffect(() => {
    if (!open || !code || status === 'used') return undefined
    let cancelled = false
    const poll = async () => {
      const data = await apiQrLoginStatus(code)
      if (cancelled || !data.ok) return
      if (data.status === 'used' || data.status === 'expired') setStatus(data.status)
    }
    poll()
    const id = setInterval(poll, 2000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [open, code, status])

  const copyLink = async () => {
    if (!loginUrl) return
    try {
      await navigator.clipboard.writeText(loginUrl)
      setCopied(true)
    } catch {
      setError('No se pudo copiar el enlace. Escanéalo con la cámara del teléfono.')
    }
  }

  const minutes = String(Math.floor(remainingSec / 60))
  const seconds = String(remainingSec % 60).padStart(2, '0')

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
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-session-title"
            initial={{ scale: 0.96, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 16, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="relative w-full max-w-md glass-strong rounded-3xl overflow-hidden shadow-elevated"
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-evently-border/80">
              <div className="flex items-center gap-3 min-w-0">
                <img src={LOGO_LIGHT} alt="" className="h-10 w-auto object-contain" draggable={false} />
                <div className="min-w-0">
                  <h3 id="qr-session-title" className="text-lg font-display font-bold text-evently-text">
                    Entrar en el teléfono
                  </h3>
                  <p className="text-evently-muted text-xs">Código de un solo uso · 3 minutos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="w-9 h-9 rounded-full glass flex items-center justify-center text-evently-muted hover:text-evently-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-5">
              <p className="text-sm text-evently-textSecondary leading-relaxed mb-4">
                Escanea el código con la app Evently para entrar con esta sesión.
              </p>

              {error && (
                <p className="text-sm text-evently-energy bg-evently-energy/8 border border-evently-energy/25 rounded-xl px-3 py-2 mb-4">
                  {error}
                </p>
              )}

              {status === 'used' ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
                  <p className="font-display font-bold text-emerald-900">El teléfono ya inició sesión</p>
                  <p className="text-xs text-emerald-800/90 mt-1">
                    Este código quedó usado. Si hace falta, genera otro.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-evently-border bg-white p-4 text-center mb-4">
                  {loading || !image ? (
                    <div className="h-56 flex items-center justify-center text-evently-muted">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : (
                    <img
                      src={image}
                      alt="Código QR para iniciar sesión en el teléfono"
                      className={`mx-auto w-56 h-56 ${expired ? 'opacity-30' : ''}`}
                    />
                  )}
                  <p className="text-xs text-evently-muted mt-2 inline-flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5" />
                    {expired ? 'El código expiró' : `Válido por ${minutes}:${seconds}`}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={issue}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-evently-border text-sm font-medium hover:bg-evently-bg disabled:opacity-60"
                >
                  <RefreshCw className="w-4 h-4" />
                  Nuevo código
                </button>
                {loginUrl && status !== 'used' && !expired && (
                  <button
                    type="button"
                    onClick={copyLink}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-evently-text text-white text-sm font-medium hover:opacity-90"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Enlace copiado' : 'Copiar enlace'}
                  </button>
                )}
              </div>

              {loginUrl && status !== 'used' && !expired && (
                <p className="mt-3 text-[11px] break-all text-evently-textSecondary leading-relaxed">
                  {loginUrl}
                </p>
              )}

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
