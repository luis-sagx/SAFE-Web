import CertificateBadge from '../components/ui/InsigniaCertificado'

// Solo para desarrollo (ver App.tsx: la ruta ni se registra en producción).
// Deja ver el diseño de la insignia (issue #230) sin tener que aprobar los 7
// módulos del entrenamiento de verdad.
function InsigniaPreview() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <CertificateBadge
        nombre="Sebastián Parra"
        modulos={['phishing', 'smishing', 'vishing', 'suplantacion', 'estafa', 'fisico', 'asistentes-ia']}
        horas={4}
        className="w-full max-w-xs"
      />
    </div>
  )
}

export default InsigniaPreview
