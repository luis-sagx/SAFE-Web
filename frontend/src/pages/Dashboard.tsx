import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import AppHeader from '../components/AppHeader'
import BarraProgreso from '../components/BarraProgreso'
import CertificadoBoton from '../components/CertificadoBoton'
import InfoLink from '../components/InfoLink'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { escenariosDeSeccion, SECCIONES } from '../data/catalogo'
import { fetchProgreso, type Progreso } from '../lib/api'

/// Solo las secciones con escenarios tienen gating; las demás muestran
/// "Pronto" y no hace falta pedir su progreso.
const SECCIONES_ACTIVAS = SECCIONES.filter((s) => escenariosDeSeccion(s.id).length > 0)

/**
 * Avance del entrenamiento completo, sumando solo los módulos disponibles.
 *
 * Las secciones que aún no tienen escenarios se quedan fuera del denominador a
 * propósito: contarlas mostraría un avance de "3 de 48" que no refleja nada que
 * el participante pueda hacer hoy, y que se movería solo porque abrimos un
 * módulo nuevo.
 *
 * Un módulo cuyo progreso no llegó tampoco entra en el denominador. Es el mismo
 * criterio: un módulo sin umbral en el servidor no se puede aprobar, así que
 * contarlo dejaba el marcador en un "x/6 módulos" que nadie podía completar.
 * Cuando el servidor le dé umbral, vuelve a contar solo.
 */
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
  const { displayName, logout } = useAuth()
  const [progresos, setProgresos] = useState<Record<string, Progreso>>({})

  useEffect(() => {
    let cancelled = false

    // allSettled y no all: un módulo que todavía no tiene umbral en el servidor
    // responde 404, y con Promise.all ese único rechazo tiraba la promesa
    // entera. El panel se quedaba sin ningún progreso —barra en cero e
    // insignias "Aprobado" apagadas— para todos los módulos, incluidos los que
    // sí habían respondido.
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

  // Por dónde se sigue: el primer módulo del recorrido que todavía no está
  // aprobado. Solo cuenta los que ya respondieron su progreso, para no marcar
  // como "empieza aquí" un módulo que un segundo después resulta estar
  // aprobado; mientras no haya llegado nada, ninguna tarjeta lleva insignia.
  const entrada = SECCIONES_ACTIVAS.find((s) => progresos[s.id] && !progresos[s.id]?.aprobado)

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader>
        <span className="text-sm font-semibold text-ink">SAFE Web</span>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-body sm:inline">{displayName}</span>
          <Link to="/recorrido" className="text-sm font-medium text-link underline">
            Tu recorrido
          </Link>
          <InfoLink />
          <button
            type="button"
            onClick={logout}
            className="h-9 rounded-md border border-hairline-strong bg-surface px-3 text-sm font-medium text-ink transition hover:bg-surface-strong"
          >
            Salir
          </button>
        </div>
      </AppHeader>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.88px] text-muted">
          Entrenamiento
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">
          Hola, {displayName}
        </h1>
        {/* Dice la regla del curso, no una promesa que el veredicto luego
            desmiente. Antes prometía que ninguna respuesta te deja mal y a los
            diez minutos el panel de resultado decía "caíste en la trampa": de
            las dos, la que se recuerda es la segunda. */}
        <p className="mt-3 max-w-xl text-base leading-relaxed text-body">
          Elige un tipo de engaño y enfréntate a una situación como las de todos los días. Puedes
          fallar y repetir: lo que cuenta es tu último intento en cada escenario.
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
              {/* Los módulos van primero y con el número grande: aprobar un
                  módulo es la meta del curso, y el total de escenarios no lo
                  es —aprobar los 8 de un módulo no vale más que aprobar 6—.
                  El detalle por escenario queda detrás, en letra chica. */}
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

            {/* Solo cuando ya no queda ningún módulo pendiente: el botón pide
                los mismos módulos que declara el servidor (UMBRALES), nunca
                un número escrito aquí, así que aparece exactamente cuando
                `GET /api/runs/atestacion` va a decir que sí. */}
            {global.modulos > 0 && global.modulosAprobados === global.modulos && (
              <CertificadoBoton />
            )}
          </section>
        )}

        {/* Tres columnas como máximo: las seis secciones se reparten en dos
            filas exactas. Con cuatro quedaba una fila coja. */}
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
                    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.88px] text-success">
                      <CheckCircle2 aria-hidden className="size-3.5" strokeWidth={2.5} />
                      Aprobado
                    </span>
                  )}
                  {/* Una sola tarjeta lleva esta insignia. Seis tarjetas del
                      mismo peso no dicen por dónde se entra, y el recorrido sí
                      tiene un orden: este es el primer módulo sin aprobar. */}
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

                  {/* Cuánto es el módulo, antes de entrar. Sin esta línea la
                      tarjeta no decía a qué se estaba apuntando el
                      participante y había que abrirla para averiguarlo.
                      El umbral no se repite aquí: ya lo marca el anillo de
                      la barra de abajo, como en un curso que no imprime la
                      nota mínima en cada tarjeta. */}
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

            // Las secciones sin escenarios se distinguen por la superficie y la
            // insignia, no bajando la opacidad: atenuar el texto lo dejaría por
            // debajo del contraste mínimo.
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
      </main>
    </div>
  )
}

export default Dashboard
