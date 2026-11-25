import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const file = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../node_modules/@aparajita/capacitor-biometric-auth/android/src/main/java/com/aparajita/capacitor/biometricauth/AuthActivity.java',
)

if (!fs.existsSync(file)) {
  console.log('plugin biometric ausente, sin parche')
  process.exit(0)
}

let source = fs.readFileSync(file, 'utf8')
if (source.includes('espera un ciclo')) {
  console.log('parche de huella ya aplicado')
  process.exit(0)
}

const original = '    prompt.authenticate(promptInfo);\n  }'
const patched = `    // El prompt en onCreate se cancela solo (ERROR_CANCELED)
    // porque la actividad todavía no está resumed. Se espera un ciclo.
    new Handler(getMainLooper()).post(() -> {
      if (!isFinishing()) {
        prompt.authenticate(promptInfo);
      }
    });
  }`

if (!source.includes(original)) {
  console.log('AuthActivity no coincide con el parche; se deja igual')
  process.exit(0)
}

source = source.replace(
  '    BiometricPrompt.PromptInfo promptInfo = builder.build();',
  '    final BiometricPrompt.PromptInfo promptInfo = builder.build();',
)
source = source.replace(
  '    BiometricPrompt prompt = new BiometricPrompt(',
  '    final BiometricPrompt prompt = new BiometricPrompt(',
)
if (!source.includes(original)) {
  console.log('no se pudo preparar el prompt; se deja igual')
  process.exit(0)
}
source = source.replace(original, patched)
fs.writeFileSync(file, source)
console.log('parche de huella aplicado')
