import { useEffect } from 'react'
import { buildAppIntentUrl, parseQrLoginPayload } from '../lib/qrLogin.js'
import { LOGO_LIGHT } from '../constants/brand.js'

/**
 * Chrome abre esta página (http). Desde aquí se lanza la app Evently.
 * Pegar intent:// en la barra de Chrome se convierte en una búsqueda.
 */
export default function OpenInApp() {
  const code = parseQrLoginPayload(window.location.href)
  const intentUrl = code ? buildAppIntentUrl(code) : ''

  useEffect(() => {
    if (!intentUrl) return undefined
    const timer = window.setTimeout(() => {
      window.location.href = intentUrl
    }, 400)
    return () => window.clearTimeout(timer)
  }, [intentUrl])

  return (
    <main className="min-h-screen bg-evently-bg text-evently-text flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <img src={LOGO_LIGHT} alt="Evently" className="h-12 mx-auto mb-6" />
        {intentUrl ? (
          <>
            <h1 className="font-display font-black text-2xl mb-2">Abriendo la app</h1>
            <p className="text-sm text-evently-textSecondary leading-relaxed mb-6">
              Evently se abre con tu sesión. Si te quedas en esta pantalla, toca el botón.
            </p>
            <a
              href={intentUrl}
              className="inline-flex w-full items-center justify-center py-3.5 rounded-full text-white text-sm font-semibold btn-cta"
            >
              Abrir Evently
            </a>
          </>
        ) : (
          <>
            <h1 className="font-display font-black text-2xl mb-2">Enlace vencido</h1>
            <p className="text-sm text-evently-textSecondary leading-relaxed">
              Genera otro código en la computadora, en Entrar en el teléfono, y pega el enlace nuevo.
            </p>
          </>
        )}
      </div>
    </main>
  )
}
