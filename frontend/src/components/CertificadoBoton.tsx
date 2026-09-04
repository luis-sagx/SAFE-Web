import { useState } from 'react'
import { ApiError, descargarCertificadoPdf, emitirCertificado, fetchAtestacion } from '../lib/api'

type Estado = 'idle' | 'generando' | 'error'

/**
 * El botón de certificado del dashboard: solo aparece cuando ya se aprobaron
 * todos los módulos que declara el servidor (`UMBRALES`), nunca un número
 * fijo — así el día que crezca no hay que tocar este componente.
 *
 * El flujo son tres peticiones seguidas —atestación, canje, PDF— porque el
 * progreso y el nombre viven en servicios distintos a propósito (§5.2 del
 * diseño): la atestación es el único dato que puede cruzar entre ellos, y
 * viaja firmada por el cliente, no por una llamada de servidor a servidor.
 */
function CertificadoBoton() {
  const [estado, setEstado] = useState<Estado>('idle')

  async function descargar() {
    setEstado('generando')
    try {
      const { atestacion } = await fetchAtestacion()
      await emitirCertificado(atestacion)
      const pdf = await descargarCertificadoPdf(atestacion)

      // Descarga real del navegador: la URL del blob solo vive en esta
      // pestaña, y se libera apenas el enlace hizo su trabajo.
      const url = URL.createObjectURL(pdf)
      const enlace = document.createElement('a')
      enlace.href = url
      enlace.download = 'certificado-safe-web.pdf'
      enlace.click()
      URL.revokeObjectURL(url)

      setEstado('idle')
    } catch (error) {
      setEstado('error')
      // 409: el progreso cambió justo entre cargar el dashboard y pulsar el
      // botón (p. ej. otra pestaña bajó una nota). El mensaje del servidor ya
      // lo explica; no hace falta uno propio.
      if (!(error instanceof ApiError)) {
        // eslint-disable-next-line no-console -- ayuda a depurar en producción
        console.error(error)
      }
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => void descargar()}
        disabled={estado === 'generando'}
        className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-on-primary transition hover:bg-primary-active disabled:cursor-default disabled:opacity-70"
      >
        {estado === 'generando' ? 'Generando…' : 'Descargar certificado'}
      </button>

      {estado === 'error' && (
        <p className="mt-2 text-sm text-danger">
          No se pudo generar el certificado. Vuelve a intentarlo en un momento.
        </p>
      )}
    </div>
  )
}

export default CertificadoBoton
