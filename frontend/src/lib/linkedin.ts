import type { Certificate } from './api'

const LINKEDIN_ADD_TO_PROFILE_URL = 'https://www.linkedin.com/profile/add'
const CERTIFICATION_NAME = 'Certificado SAFE-Web'

/** Sin `organizationId`: requiere el ID de una LinkedIn Company Page que
 *  SAFE-Web todavía no tiene. Sin ese parámetro, LinkedIn igual arma el
 *  formulario de "Agregar a perfil"; la persona solo escribe la
 *  organización a mano en vez de que LinkedIn la autocomplete. Agregar
 *  `organizationId` más adelante es un cambio de una línea acá. */
export function buildLinkedInAddToProfileUrl(certificate: Certificate, origin: string): string {
  const issuedAt = new Date(certificate.emitidoAt)
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: CERTIFICATION_NAME,
    certUrl: `${origin}/verificar/${certificate.codigo}`,
    certId: certificate.codigo,
    issueYear: String(issuedAt.getFullYear()),
    issueMonth: String(issuedAt.getMonth() + 1),
  })
  return `${LINKEDIN_ADD_TO_PROFILE_URL}?${params.toString()}`
}
