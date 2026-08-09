import { randomBytes, createHash } from 'crypto'

// TTL del link público de aprobación de hallazgo (/aprobar/[hallazgoId]).
// No es el caso de uso del QR de sesión (60s) - acá el cliente puede tardar
// días en abrir el WhatsApp.
export const APROBACION_TOKEN_TTL_DIAS = 7

// Token crudo: 256 bits de entropía, nunca se persiste tal cual - solo su
// hash. El token en texto plano solo existe acá y en el link que se manda
// por WhatsApp.
export function generarTokenAprobacion() {
  return randomBytes(32).toString('base64url')
}

export function hashTokenAprobacion(token) {
  return createHash('sha256').update(token).digest('hex')
}

export function calcularExpiracion() {
  return new Date(Date.now() + APROBACION_TOKEN_TTL_DIAS * 24 * 60 * 60 * 1000)
}
