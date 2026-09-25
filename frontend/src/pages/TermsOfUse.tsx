import type { ReactNode } from "react";
import { Link } from "react-router";
import { AUTHOR_NAMES, DEGREE, INSTITUTION, PROJECT_TITLE } from "../data/project";

// Fecha fija de la versión vigente: se cambia a mano al editar el texto.
const LAST_UPDATED = "25 de septiembre de 2026";

const SECTIONS: { id: string; title: string; body: ReactNode }[] = [
  {
    id: "que-es",
    title: "Qué es SAFE-Web",
    body: (
      <p>
        SAFE-Web es el prototipo del Trabajo de Integración Curricular "
        {PROJECT_TITLE}", desarrollado para obtener el título de {DEGREE} en la{" "}
        {INSTITUTION}. Su único fin es educativo y de investigación: enseñar a
        reconocer fraudes digitales mediante simulaciones. No es un servicio
        comercial.
      </p>
    ),
  },
  {
    id: "aceptacion",
    title: "Aceptación",
    body: (
      <p>
        Al crear una cuenta aceptas estos términos y la{" "}
        <Link to="/politica-de-datos" className="font-medium text-link underline">
          política de datos
        </Link>
        . Si no estás de acuerdo, no te registres; la portada y sus videos se
        pueden ver sin cuenta.
      </p>
    ),
  },
  {
    id: "simulaciones",
    title: "Los escenarios son simulaciones",
    body: (
      <ul className="mt-3 list-disc space-y-2 pl-6">
        <li>
          Los correos, mensajes, llamadas, sitios y personas que aparecen son
          ficticios. Cualquier parecido con marcas o entidades reales sirve solo
          para que la práctica sea realista; esas entidades no participan ni
          respaldan el proyecto.
        </li>
        <li>
          Nada de lo que hagas en un escenario llega a un banco, al SRI ni a
          ninguna entidad real.
        </li>
        <li>
          <strong>No escribas datos reales</strong> (contraseñas, números de
          tarjeta, códigos) dentro de un escenario.
        </li>
      </ul>
    ),
  },
  {
    id: "uso",
    title: "Uso aceptable",
    body: (
      <>
        <p>Al usar la plataforma te comprometes a:</p>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>Registrarte con tus propios datos y mantener tu contraseña en privado.</li>
          <li>No intentar acceder a cuentas ajenas ni a partes restringidas.</li>
          <li>
            No usar las técnicas mostradas en los escenarios para engañar a otras
            personas.
          </li>
          <li>No interferir con el funcionamiento de la plataforma.</li>
        </ul>
        <p className="mt-3">
          El equipo puede desactivar una cuenta que incumpla estas reglas.
        </p>
      </>
    ),
  },
  {
    id: "certificado",
    title: "Certificado",
    body: (
      <p>
        El certificado acredita que completaste el entrenamiento dentro de este
        proyecto académico. No es un título ni una certificación profesional
        oficial.
      </p>
    ),
  },
  {
    id: "disponibilidad",
    title: "Disponibilidad y responsabilidad",
    body: (
      <>
        <p>
          La plataforma se ofrece tal como está, sin garantías de disponibilidad
          continua ni de ausencia de errores. Puede cambiar, pausarse o
          retirarse, en particular al concluir el proyecto.
        </p>
        <p className="mt-3">
          El contenido es orientativo y no sustituye el asesoramiento de tu
          banco o de un profesional de seguridad. En la medida que permita la
          ley, los autores no responden por daños derivados del uso de la
          plataforma.
        </p>
      </>
    ),
  },
  {
    id: "contenido",
    title: "Propiedad del contenido",
    body: (
      <p>
        Los escenarios, textos, videos y el código de SAFE-Web pertenecen a sus
        autores y a la {INSTITUTION}, según corresponda. Puedes usarlos para tu
        aprendizaje personal; para otro uso, pide autorización.
      </p>
    ),
  },
  {
    id: "cambios",
    title: "Cambios",
    body: (
      <p>
        Si cambiamos estos términos, actualizaremos la fecha que aparece al inicio
        de esta página.
      </p>
    ),
  },
  {
    id: "contacto",
    title: "Contacto",
    body: (
      <p>
        Para dudas sobre estos términos escribe a los responsables del proyecto:{" "}
        {AUTHOR_NAMES}. Sus correos están en la sección "Contacto" de la{" "}
        <Link to="/politica-de-datos" className="font-medium text-link underline">
          política de datos
        </Link>
        .
      </p>
    ),
  },
];

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-canvas">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link
          to="/"
          className="mb-6 inline-flex min-h-11 items-center text-base font-medium text-link underline"
        >
          ← Volver
        </Link>

        <h1 className="text-4xl font-bold text-ink">Términos de uso</h1>
        <p className="mt-3 text-base text-muted">Última actualización: {LAST_UPDATED}</p>

        <div className="mt-8 space-y-10 text-base leading-relaxed text-body">
          {SECTIONS.map((section, index) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-titulo`}>
              <h2 id={`${section.id}-titulo`} className="mb-3 text-xl font-semibold text-ink">
                {index + 1}. {section.title}
              </h2>
              {section.body}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
