import { Link } from 'react-router'

export default function PoliticaDatos() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link to="/" className="mb-6 inline-flex text-sm font-medium text-link underline hover:text-link-active">
          ← Volver
        </Link>

        <h1 className="mb-8 text-4xl font-bold text-heading">Política de Datos</h1>

        <div className="space-y-6 text-base leading-relaxed text-body">
          <section>
            <h2 className="mb-4 text-xl font-semibold text-heading">1. Recopilación de Información</h2>
            <p>
              Recopilamos información personal para proporcionar y mejorar nuestros servicios de entrenamiento en
              ciberseguridad. Esta información incluye:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-2">
              <li>Información de identificación: nombre, apellido, cédula de identidad</li>
              <li>Información de contacto: correo electrónico</li>
              <li>Información de progreso: resultados de escenarios, certificados obtenidos</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-heading">2. Uso de la Información</h2>
            <p>Utilizamos la información recopilada para:</p>
            <ul className="mt-2 list-inside list-disc space-y-2">
              <li>Proporcionar acceso a nuestro plataforma de entrenamiento</li>
              <li>Registrar tu progreso y desempeño en los escenarios</li>
              <li>Generar certificados de participación</li>
              <li>Mejorar la calidad de nuestros contenidos</li>
              <li>Cumplir con obligaciones legales</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-heading">3. Protección de Datos</h2>
            <p>
              Tus datos se tratan de forma confidencial y segura. Implementamos medidas técnicas y organizativas para
              proteger tu información contra acceso no autorizado, alteración o divulgación.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-heading">4. Anonimización de Resultados</h2>
            <p>
              Aunque registramos tu nombre para generar certificados, tus resultados de entrenamiento se analizan de
              forma anónima. Esto significa que en reportes y estadísticas no aparece tu identidad, solo datos
              agregados sin vincular a personas específicas.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-heading">5. Derechos de Acceso y Control</h2>
            <p>Tienes derecho a:</p>
            <ul className="mt-2 list-inside list-disc space-y-2">
              <li>Acceder a tus datos personales en cualquier momento</li>
              <li>Solicitar correcciones si la información es inexacta</li>
              <li>Solicitar la eliminación de tus datos (derecho al olvido)</li>
              <li>Recibir tus datos en formato estructurado (portabilidad)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-heading">6. Cookies y Tecnologías de Rastreo</h2>
            <p>
              Utilizamos cookies para mantener tu sesión y mejorar tu experiencia en la plataforma. Las cookies se
              almacenan localmente en tu navegador y no contienen información personal sensible.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-heading">7. Retención de Datos</h2>
            <p>
              Conservamos tu información mientras tu cuenta esté activa. Si desactivas tu cuenta, tus datos se
              eliminarán dentro de 30 días, salvo que la ley requiera su conservación.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-heading">8. Cambios a esta Política</h2>
            <p>
              Podemos actualizar esta política de datos en cualquier momento. Los cambios significativos se
              comunicarán por correo electrónico o mediante notificación en la plataforma.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-heading">9. Contacto</h2>
            <p>
              Si tienes preguntas sobre esta política o sobre cómo manejamos tus datos, puedes contactarnos en:
              <br />
              <span className="font-medium">soporte@safe-web.com</span>
            </p>
          </section>

          <div className="mt-8 border-t border-border pt-6">
            <p className="text-sm text-muted">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
