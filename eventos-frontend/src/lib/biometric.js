import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import {
  AndroidBiometryStrength,
  BiometricAuth,
} from '@aparajita/capacitor-biometric-auth'

const OK_KEY = 'evently_fp_ok'

export function isNativeApp() {
  return Capacitor.isNativePlatform()
}

export function fingerprintClearedThisLaunch() {
  return sessionStorage.getItem(OK_KEY) === '1'
}

export function markFingerprintOk() {
  sessionStorage.setItem(OK_KEY, '1')
  desbloqueadoEn = Date.now()
}

export function clearFingerprintOk() {
  sessionStorage.removeItem(OK_KEY)
}

let enCurso = false
let desbloqueadoEn = 0

function acabaDeDesbloquear() {
  return Date.now() - desbloqueadoEn < 2500
}

export async function listenAppResume(onResume) {
  const handle = await App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) {
      if (enCurso || acabaDeDesbloquear()) return
      clearFingerprintOk()
      return
    }
    if (enCurso || acabaDeDesbloquear()) return
    onResume()
  })
  return handle
}

export async function unlockWithFingerprint() {
  if (enCurso) return { ok: false, skipped: true }
  enCurso = true
  try {
    return await pedirHuella()
  } finally {
    enCurso = false
  }
}

async function pedirHuella() {
  const info = await BiometricAuth.checkBiometry()
  if (!info.isAvailable && !info.strongBiometryIsAvailable) {
    return {
      ok: false,
      error: 'Configura la huella en el teléfono para abrir Evently.',
    }
  }

  try {
    await BiometricAuth.authenticate({
      reason: 'Confirma tu huella para abrir Evently',
      cancelTitle: 'Cancelar',
      allowDeviceCredential: false,
      androidTitle: 'Evently',
      androidSubtitle: 'Usa la huella del teléfono',
      androidConfirmationRequired: false,
      androidBiometryStrength: AndroidBiometryStrength.strong,
    })
    markFingerprintOk()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: mensajeHuella(error) }
  }
}

function mensajeHuella(error) {
  const code = String(error?.code || '')
  const raw = String(error?.message || '')
  if (code.includes('userCancel') || /cancel/i.test(raw)) {
    return 'Se canceló la lectura de la huella.'
  }
  if (/enrolled|biometrics/i.test(raw)) {
    return 'Este teléfono no tiene una huella configurada.'
  }
  if (/not recognized|no match|failed|lockout/i.test(raw)) {
    return 'La huella no coincidió con la del dispositivo.'
  }
  return 'No se pudo confirmar la huella.'
}
