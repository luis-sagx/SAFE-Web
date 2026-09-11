import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import AppHeader from '../components/AppHeader'
import BarraProgreso from '../components/BarraProgreso'
import CertificadoBoton from '../components/CertificadoBoton'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { escenariosDeSeccion, SECCIONES } from '../data/catalogo'
import { fetchProgreso, type Progreso } from '../lib/api'

// Solo secciones con escenarios tienen gating; las demás muestran "Pronto" sin pedir progreso.
const SECCIONES_ACTIVAS = SECCIONES.filter((s) => escenariosDeSeccion(s.id).length > 0)

// Secciones sin escenarios y módulos sin progreso quedan fuera del denominador: contarlos daría un avance que
// nadie puede mover hoy (sin escenarios) o nunca completar (sin umbral en el servidor).
function calcularGlobal(progresos: Record<string, Progreso>) {
  let aprobados = 0
  let total = 0
  let requeridos = 0
  let modulosAprobados = 0
  let modulos = 0

  for (const seccion of SECCIONES_ACTIVAS) {
    const progreso = progresos[seccion.id]
    if (!progreso) continue
    modulos += 1
    total += escenariosDeSeccion(seccion.id).length
    aprobados += progreso.aprobados
    requeridos += progreso.requeridos
    if (progreso.aprobado) modulosAprobados += 1
  }

  return { aprobados, total, requeridos, modulosAprobados, modulos }
}

function Dashboard() {
  const { displayName } = useAuth()
  const [progresos, setProgresos] = useState<Record<string, Progreso>>({})

  useEffect(() => {
    let cancelled = false

    // allSettled: un módulo sin umbral aún responde 404, y con Promise.all ese rechazo vaciaba el progreso de todos.
    Promise.allSettled(SECCIONES_ACTIVAS.map((s) => fetchProgreso(s.id)))
      .then((resultados) => {
        if (cancelled) return
        const cargados = resultados
          .filter((r) => r.status === 'fulfilled')
          .map((r) => r.value)
        setProgresos(Object.fromEntries(cargados.map((p) => [p.modulo, p])))
      })

    return () => {
      cancelled = true
    }
  }, [])

  const global = calcularGlobal(progresos)

  // Primer módulo sin aprobar, solo entre los que ya respondieron: evita marcar "empieza aquí" antes de tiempo.
  const entrada = SECCIONES_ACTIVAS.find((s) => progresos[s.id] && !progresos[s.id]?.aprobado)

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.88px] text-muted">
          Entrenamiento
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">
          Hola, {displayName}
        </h1>
        {/* Regla del curso, no promesa: antes decía que ninguna respuesta te deja mal y el resultado decía lo contrario. */}
        <p className="mt-3 max-w-xl text-base leading-relaxed text-body">
          Elige un tipo de engaño y enfréntate a una situación como las de todos los días. Puedes
          fallar y repetir el módulo completo: lo que cuenta es tu última ronda completa.
        </p>

        {global.total > 0 && (
          <section
            aria-labelledby="titulo-global"
            className="mt-8 rounded-lg border border-hairline-strong bg-canvas-soft p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h2
                id="titulo-global"
                className="text-xs font-semibold uppercase tracking-[0.88px] text-muted"
              >
                Tu avance
              </h2>
              {/* Módulos primero y en grande: aprobar un módulo es la meta, no acumular escenarios. */}
              <p className="text-sm text-body">
                <span className="text-lg font-semibold tabular-nums text-ink">
                  {global.modulosAprobados}
                </span>
                <span className="text-muted">/{global.modulos}</span>{' '}
                {global.modulos === 1 ? 'módulo aprobado' : 'módulos aprobados'}
                <span aria-hidden className="mx-2 text-muted-soft">
                  ·
                </span>
                <span className="tabular-nums">{global.aprobados}</span>
                <span className="text-muted">/{global.total}</span> escenarios
              </p>
            </div>

            <BarraProgreso
              className="mt-3"
              variante="continua"
              aprobados={global.aprobados}
              total={global.total}
              requeridos={global.requeridos || undefined}
              aprobado={global.modulosAprobados === global.modulos}
              etiqueta="Avance del entrenamiento completo"
            />

            {/* Aparece solo cuando coincide con lo que UMBRALES del servidor exige, nunca un número fijo aquí. */}
            {global.modulos > 0 && global.modulosAprobados === global.modulos && (
              <CertificadoBoton />
            )}
          </section>
        )}

        {/* Tres columnas: las seis secciones caben en dos filas exactas (cuatro dejaba una fila coja). */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECCIONES.map((seccion) => {
            const escenarios = escenariosDeSeccion(seccion.id)
            const disponible = escenarios.length > 0
            const progreso = progresos[seccion.id]
            const esEntrada = seccion.id === entrada?.id
            const empezado = (progreso?.escenarios.length ?? 0) > 0

            const Icono = seccion.Icono

            const contenido = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`flex size-9 items-center justify-center rounded-md ${
                      esEntrada ? 'bg-mint-light' : 'bg-surface-strong'
                    } ${disponible ? 'text-link' : 'text-muted'}`}
                  >
                    <Icono aria-hidden className="size-[18px]" strokeWidth={1.75} />
                  </span>
                  {!disponible && (
                    <span className="text-xs font-semibold uppercase tracking-[0.88px] text-muted">
                      Pronto
                    </span>
                  )}
                  {progreso?.aprobado && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.88px] text-success-ink">
                      <CheckCircle2 aria-hidden className="size-3.5" strokeWidth={2.5} />
                      Aprobado
                    </span>
                  )}
                  {/* Única insignia: marca el primer módulo sin aprobar, el orden de entrada al recorrido. */}
                  {esEntrada && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.88px] text-on-primary">
                      {empezado ? 'Continúa aquí' : 'Empieza aquí'}
                    </span>
                  )}
                </div>

                <h2 className="mt-4 text-lg font-semibold text-ink">{seccion.titulo}</h2>
                <p className="mt-2 flex-1 text-base leading-relaxed text-body">
                  {seccion.descripcion}
                </p>

                <div className="mt-5 border-t border-hairline pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span className="text-sm text-muted">{seccion.canal}</span>
                    {progreso && (
                      <span className="text-sm font-medium text-ink tabular-nums">
                        {progreso.aprobados}/{escenarios.length}
                      </span>
                    )}
                  </div>

                  {/* Cuenta de escenarios antes de entrar; el umbral no se repite, ya lo marca la barra de abajo. */}
                  {disponible && (
                    <p className="mt-1.5 text-sm text-muted">{escenarios.length} escenarios</p>
                  )}

                  {progreso && (
                    <BarraProgreso
                      className="mt-2.5"
                      aprobados={progreso.aprobados}
                      total={escenarios.length}
                      requeridos={progreso.requeridos}
                      aprobado={progreso.aprobado}
                      etiqueta={`Avance de ${seccion.titulo}`}
                    />
                  )}
                </div>
              </>
            )

            const clases = 'flex flex-col rounded-lg border p-5 transition'

            // Se distinguen por superficie/insignia, no opacidad: bajarla dejaría el texto bajo el contraste mínimo.
            return disponible ? (
              <Link
                key={seccion.id}
                to={`/seccion/${seccion.id}`}
                className={`${clases} bg-surface hover:-translate-y-0.5 hover:shadow-card ${
                  esEntrada
                    ? 'border-link/50 shadow-card hover:border-link'
                    : 'border-hairline-strong hover:border-link/40'
                }`}
              >
                {contenido}
              </Link>
            ) : (
              <div key={seccion.id} className={`${clases} border-hairline-strong bg-canvas-soft`}>
                {contenido}
              </div>
            )
          })}
        </div>

        {/* Deshabilitado hasta completar el entrenamiento: antes no hay experiencia completa que valorar; sigue
            visible para que se sepa que existe. */}
        <p className="mt-10 text-center text-sm text-muted">
          {global.modulos > 0 && global.modulosAprobados === global.modulos ? (
            <>
              ¿Qué te pareció el entrenamiento?{' '}
              <a
                href="https://forms.gle/jdqLTpKyPH2eYzBk7"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-link underline"
              >
                Cuéntanos tu opinión
              </a>
            </>
          ) : (
            `Completa las ${global.modulos || SECCIONES_ACTIVAS.length} secciones y se habilitará un formulario para valorar tu opinión.`
          )}
        </p>
      </main>
    </div>
  )
}

export default Dashboard
