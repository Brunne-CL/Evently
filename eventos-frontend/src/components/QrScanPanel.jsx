import { useEffect, useRef, useState } from 'react'
import { Camera, Loader2, Smartphone } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { parseQrLoginPayload } from '../lib/qrLogin.js'

/**
 * En el teléfono: lee el QR que mostró la web e inicia la sesión.
 */
export default function QrScanPanel({ onSuccess }) {
  const { loginWithQr } = useAuth()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const stopRef = useRef(false)
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paste, setPaste] = useState('')

  const stopCamera = () => {
    stopRef.current = true
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setScanning(false)
  }

  useEffect(() => () => {
    stopRef.current = true
    streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  const redeem = async (raw) => {
    const code = parseQrLoginPayload(raw)
    if (!code) {
      setError('Ese código no es de un inicio de sesión de Evently.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await loginWithQr(code)
      if (result.ok) onSuccess?.()
      else setError(result.error || 'No se pudo iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  const startCamera = async () => {
    setError('')
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError('Aquí no se puede usar la cámara. Escanéalo con la cámara del teléfono: el enlace abre la sesión.')
      return
    }
    if (!('BarcodeDetector' in window)) {
      setError('Este navegador no lee el QR dentro de la página. Usa la cámara del teléfono sobre el código de la computadora.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      stopRef.current = false
      setScanning(true)
      const video = videoRef.current
      video.srcObject = stream
      await video.play()

      const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
      const loop = async () => {
        if (stopRef.current) return
        try {
          const found = await detector.detect(video)
          const raw = found?.[0]?.rawValue
          if (raw) {
            stopCamera()
            await redeem(raw)
            return
          }
        } catch {
          // El cuadro todavía no está listo.
        }
        if (!stopRef.current) setTimeout(loop, 280)
      }
      setTimeout(loop, 280)
    } catch {
      stopCamera()
      setError('No se pudo abrir la cámara. Revisa el permiso o escanea el código con la cámara del teléfono.')
    }
  }

  return (
    <div className="space-y-4 pb-5">
      <p className="text-sm text-evently-textSecondary leading-relaxed">
        En la computadora, con la sesión iniciada, abre <strong className="text-evently-text">Entrar en el teléfono</strong> y
        apunta la cámara a ese código.
      </p>

      <div className="rounded-2xl overflow-hidden border border-evently-border bg-evently-bg aspect-video flex items-center justify-center">
        <video
          ref={videoRef}
          muted
          playsInline
          className={`w-full h-full object-cover ${scanning ? 'block' : 'hidden'}`}
        />
        {!scanning && (
          <div className="text-center px-6 py-8 text-evently-muted">
            <Smartphone className="w-8 h-8 mx-auto mb-2" />
            <p className="text-xs leading-relaxed">La cámara se usa solo para leer el código de la web.</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-evently-energy bg-evently-energy/8 border border-evently-energy/25 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {scanning ? (
        <button
          type="button"
          onClick={stopCamera}
          className="w-full py-3 rounded-full border border-evently-border text-sm font-semibold text-evently-text"
        >
          Detener cámara
        </button>
      ) : (
        <button
          type="button"
          onClick={startCamera}
          disabled={loading}
          className="w-full py-3 rounded-full text-white text-sm font-semibold btn-cta disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          {loading ? 'Entrando...' : 'Escanear código QR'}
        </button>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          redeem(paste)
        }}
        className="space-y-2"
      >
        <label className="text-[11px] text-evently-muted" htmlFor="qr-paste">
          O pega el enlace del código
        </label>
        <input
          id="qr-paste"
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder="https://…/?qr=…"
          className="w-full px-4 py-3 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] text-evently-text placeholder-evently-muted"
        />
        <button
          type="submit"
          disabled={loading || !paste.trim()}
          className="w-full py-2.5 rounded-full border border-evently-border text-sm font-medium disabled:opacity-50"
        >
          Entrar con el enlace
        </button>
      </form>
    </div>
  )
}
