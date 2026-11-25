import { useCallback, useEffect, useState } from 'react'
import { Fingerprint } from 'lucide-react'
import { LOGO_LIGHT } from '../constants/brand.js'
import { getToken } from '../lib/api.js'
import {
  clearFingerprintOk,
  fingerprintClearedThisLaunch,
  isNativeApp,
  listenAppResume,
  unlockWithFingerprint,
} from '../lib/biometric.js'

/**
 * En la app del teléfono, una sesión ya guardada (por QR o por login)
 * no muestra Evently hasta que el sensor de huella del dispositivo coincida.
 * El primer acceso de esta apertura no vuelve a pedirla. Al pasar a segundo
 * plano se olvida el desbloqueo y la siguiente apertura la pide otra vez.
 * El sitio en el navegador de escritorio no entra en este flujo.
 */
export default function FingerprintGate({ children }) {
  const native = isNativeApp()
  const [locked, setLocked] = useState(
    () => native && Boolean(getToken()) && !fingerprintClearedThisLaunch()
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const ask = useCallback(async () => {
    setBusy(true)
    setError('')
    const result = await unlockWithFingerprint()
    setBusy(false)
    if (result.skipped) return
    if (result.ok) {
      setLocked(false)
      return
    }
    setError(result.error)
  }, [])

  useEffect(() => {
    if (!native || locked) return undefined
    let handle
    let cancelled = false
    listenAppResume(() => {
      if (getToken() && !fingerprintClearedThisLaunch()) setLocked(true)
    }).then((listener) => {
      if (cancelled) listener.remove()
      else handle = listener
    })
    return () => {
      cancelled = true
      handle?.remove()
    }
  }, [native, locked])

  useEffect(() => {
    if (!locked) return undefined
    const timer = setTimeout(() => {
      ask()
    }, 600)
    return () => clearTimeout(timer)
  }, [locked, ask])

  if (!locked) return children

  return (
    <div className="fixed inset-0 z-[200] bg-[#f4f1ea] text-[#1a1a1a] flex flex-col items-center justify-center px-8 text-center">
      <img src={LOGO_LIGHT} alt="Evently" className="h-12 w-auto mb-10" draggable={false} />
      <div className="w-24 h-24 rounded-full bg-white border border-black/10 flex items-center justify-center mb-6 shadow-sm">
        <Fingerprint className="w-12 h-12 text-[#0f6e56]" strokeWidth={1.5} />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Confirma tu huella</h1>
      <p className="mt-3 max-w-xs text-sm text-neutral-600">
        La sesión ya está en este teléfono. Evently se abre cuando la huella coincide con la del dispositivo.
      </p>
      {error && (
        <p className="mt-4 max-w-xs text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={ask}
        disabled={busy}
        className="mt-8 px-6 py-3 rounded-full bg-[#161616] text-white text-sm font-medium disabled:opacity-60"
      >
        {busy ? 'Esperando el sensor…' : 'Usar huella'}
      </button>
      <button
        type="button"
        onClick={() => {
          clearFingerprintOk()
          window.location.reload()
        }}
        className="mt-4 text-xs text-neutral-500 underline"
      >
        Reintentar
      </button>
    </div>
  )
}
