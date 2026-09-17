import { Link } from "react-router";
import AppHeader from "../components/AppHeader";
import Ticket, { Notches } from "../components/Boleto";
import ScratchTicket from "../components/BoletoRaspable";
import VideoTicket from "../components/VideoCapacitacion";
import { useAuth } from "../context/AuthContext";
import { SCENARIOS, SECTIONS } from "../data/catalogo";
import { TRAINING_VIDEOS } from "../data/videosCapacitacion";

// Enumera en español con "y" antes del último, desde el catálogo: cualquier
// módulo que se agregue o se quite aparece solo, sin retocar la portada.
const listar = (items: string[]) =>
  new Intl.ListFormat("es", { style: "long", type: "conjunction" }).format(
    items,
  );

// El cebo del boleto: un SMS de premio como los que circulan en Ecuador. Es
// un ejemplo escrito para la portada, no un mensaje capturado a nadie, y por
// eso el boleto lo rotula "ejemplo". Las tres señales son las mismas que el
// participante aprende a buscar en el módulo de smishing.
const SIGNALS = [
  {
    id: 1,
    marca: "bono-gobierno.ec-pagos.info",
    titulo: "La dirección no es del Estado",
    detalle:
      "Las páginas oficiales del Ecuador terminan en .gob.ec. Esta termina en .info.",
  },
  {
    id: 2,
    marca: "antes de las 18h00",
    titulo: "Te ponen un reloj encima",
    detalle:
      "La prisa es la herramienta: nadie verifica nada cuando cree que se le acaba el tiempo.",
  },
  {
    id: 3,
    marca: "tu clave de banca",
    titulo: "Ningún premio necesita tu clave",
    detalle:
      "Ni tu banco ni una entidad pública piden la clave por mensaje, ni siquiera para pagarte.",
  },
];

const STEPS = [
  {
    titulo: "Abres un módulo",
    detalle: `Un módulo por amenaza: ${listar(SECTIONS.map((section) => section.titulo))}.`,
  },
  {
    titulo: "Vives la situación",
    detalle:
      "Un correo, un chat o una llamada que se comporta como el de verdad. Tú decides qué hacer con él.",
  },
  {
    titulo: "Ves qué lo delataba",
    detalle:
      "Al cerrar, SAFE-Web marca las señales que estaban ahí desde el principio y explica por qué importan.",
  },
];

/** Cuántos de los ocho videos existen ya. Sale del catálogo, no de una
 *  promesa: mientras falten, el contador lo dice en el primer viewport. */
function videoCount() {
  const total = TRAINING_VIDEOS.length;
  const published = TRAINING_VIDEOS.filter((video) => video.youtubeUrl).length;
  if (published === 0) return `${total} videos en preparación`;
  if (published < total) return `${published} de ${total} videos`;
  return `${total} videos`;
}

/** Resalta dentro del SMS el fragmento de cada señal y le pone su número.
 *  Un solo tamaño de letra, como en un celular de verdad: el remitente va
 *  aparte, arriba de la burbuja, y el énfasis del estafador son solo las
 *  mayúsculas que escribiría él. */
function BaitMessage() {
  return (
    <div>
      <p className="flex items-baseline justify-between gap-3 font-mono text-sm uppercase tracking-[0.14em] text-muted">
        <span className="font-semibold text-ink">Banco Gob</span>
        <span>Hoy · 09:41</span>
      </p>
      <p className="mt-3 rounded-2xl rounded-tl-sm border border-ticket-edge bg-surface px-5 py-5 text-lg leading-loose text-ink sm:text-xl sm:leading-loose">
        <strong className="font-semibold">¡FELICIDADES!</strong> Tu número
        resultó GANADOR del bono de{" "}
        <strong className="font-semibold">$1.200</strong>. Reclama SOLO HOY{" "}
        <Mark n={2}>antes de las 18h00</Mark> en{" "}
        <Mark n={1}>bono-gobierno.ec-pagos.info</Mark> e ingresa tu cédula y{" "}
        <Mark n={3}>tu clave de banca</Mark>.
      </p>
    </div>
  );
}

function Mark({ n, children }: Readonly<{ n: number; children: string }>) {
  return (
    <mark className="bg-transparent text-ink underline decoration-warning decoration-wavy decoration-2 underline-offset-[6px] [overflow-wrap:anywhere]">
      {children}
      <span className="sr-only"> (señal {n})</span>
      <span
        aria-hidden
        className="ml-1 inline-flex size-5 -translate-y-0.5 items-center justify-center rounded-full bg-warning align-middle font-mono text-xs font-semibold text-on-warning no-underline"
      >
        {n}
      </span>
    </mark>
  );
}

function Portada() {
  const { isAuthenticated, isAdmin } = useAuth();
  const general = TRAINING_VIDEOS[0];
  const modules = TRAINING_VIDEOS.slice(1);
  let destination = { to: "/dashboard", label: "Ir a mi entrenamiento" };
  if (!isAuthenticated) {
    destination = { to: "/login", label: "Entrar al entrenamiento" };
  } else if (isAdmin) {
    destination = { to: "/admin", label: "Ir a administración" };
  }

  const primaryAction = (
    <Link
      to={destination.to}
      className="inline-flex min-h-12 items-center rounded-md bg-primary px-6 text-base font-semibold text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
    >
      {destination.label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader />

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-14 lg:py-20">
          <div>
            <h1 className="font-display text-5xl uppercase leading-[0.95] tracking-[0.01em] text-ink sm:text-6xl lg:text-7xl">
              Todo fraude
              <br />
              empieza con
              <br />
              una promesa
            </h1>
            <p className="mt-6 max-w-prose text-lg leading-relaxed text-body">
              SAFE-Web es un entrenamiento con engaños simulados,correos,
              mensajes, llamadas, compras y trampas de oficina, como los que
              circulan en Ecuador. Aquí practicas la decisión sin arriesgar tu
              dinero ni tus cuentas.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              {primaryAction}
              <a
                href="#videos"
                className="min-h-12 content-center text-base font-medium text-link underline"
              >
                Ver los videos
              </a>
            </div>

            {/* Tres medidas reales del catálogo. Se separan con un filete, no
                con un punto medio: al romper el renglón, el punto quedaba
                colgado sin término al que pertenecer. Ninguno de los ocho
                videos está grabado todavía, y el contador lo dice aquí, no
                solo cuatro pantallas más abajo. */}
            <p className="mt-8 flex flex-wrap gap-y-2 font-mono text-base uppercase tracking-[0.12em] text-muted">
              {[
                `${SECTIONS.length} módulos`,
                `${SCENARIOS.length} escenarios`,
                videoCount(),
              ].map((count) => (
                <span
                  key={count}
                  // El tercero baja siempre a su propio renglón: así el filete
                  // nunca abre una línea, que es como se veía al romper solo.
                  className="mr-4 border-l border-ticket-edge pl-4 first:border-l-0 first:pl-0 last:mt-1 last:basis-full last:border-l-0 last:pl-0"
                >
                  {count}
                </span>
              ))}
            </p>
          </div>

          <div>
            <Ticket className="overflow-hidden">
              <div className="relative flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-dashed border-ticket-edge px-5 py-3 font-mono text-sm uppercase tracking-[0.14em] text-muted">
                <span className="text-ink">SMS-01 · Ejemplo</span>
                <span>+593 98 765 4321</span>
                <Notches className="-bottom-2.5" />
              </div>

              <ScratchTicket
                accion="Revelar las señales"
                pista={
                  <>
                    <span className="font-mono text-sm uppercase tracking-[0.14em]">
                      Premio acumulado
                    </span>
                    <span className="font-display text-6xl leading-none sm:text-7xl">
                      $1.200
                    </span>
                    <span className="font-mono text-sm uppercase tracking-[0.14em]">
                      Raspa aquí
                    </span>
                  </>
                }
              >
                <div className="px-5 py-5 sm:px-6">
                  <BaitMessage />

                  {/* Compacto a propósito: título y detalle en el mismo renglón
                      corrido, para que el mensaje sea lo que ocupa el boleto. */}
                  <ol className="mt-5 space-y-2.5 border-t border-dashed border-ticket-edge pt-4">
                    {SIGNALS.map((signal) => (
                      <li key={signal.id} className="flex gap-3">
                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-warning font-mono text-sm font-semibold text-on-warning">
                          {signal.id}
                        </span>
                        <p className="text-base leading-snug text-body">
                          <span className="font-semibold text-ink">
                            {signal.titulo}
                          </span>
                          . {signal.detalle}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              </ScratchTicket>
            </Ticket>
          </div>
        </section>

        <section
          aria-labelledby="recorrido"
          className="mx-auto max-w-7xl px-6 py-12 lg:py-16"
        >
          <h2
            id="recorrido"
            className="font-display text-3xl uppercase tracking-[0.01em] text-ink sm:text-4xl"
          >
            Así es un módulo
          </h2>

          <Ticket className="mt-6 grid divide-y divide-dashed divide-ticket-edge sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {STEPS.map((step) => (
              <div key={step.titulo} className="p-6 sm:p-7">
                <h3 className="font-display text-2xl uppercase tracking-[0.01em] text-ink">
                  {step.titulo}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-body">
                  {step.detalle}
                </p>
              </div>
            ))}
          </Ticket>
        </section>

        <section
          id="videos"
          aria-labelledby="videos-titulo"
          className="mx-auto max-w-7xl px-6 py-12 lg:py-16"
        >
          <h2
            id="videos-titulo"
            className="font-display text-3xl uppercase tracking-[0.01em] text-ink sm:text-4xl"
          >
            ¿Cómo funciona SAFE-Web?
          </h2>
          <p className="mt-3 max-w-prose text-lg leading-relaxed text-body">
            Con esta lista de videos entenderas cómo se ve un engaño, qué
            señales lo delatan y por qué importa no caer en él.
          </p>

          {general && (
            <div className="mt-8">
              <VideoTicket
                video={general}
                folio="GEN-00"
                etiqueta="La plataforma"
              />
            </div>
          )}

          {/* Una tira de boletos perforada, no siete tarjetas sueltas: los
              módulos se leen en orden y comparten el mismo papel. */}
          <Ticket className="mt-10 overflow-hidden">
            <ul>
              {modules.map((video, index) => (
                <VideoTicket
                  key={video.id}
                  video={video}
                  folio={`MOD-${String(index + 1).padStart(2, "0")}`}
                  etiqueta={
                    SECTIONS.find((section) => section.id === video.sectionId)
                      ?.canal
                  }
                  conMuescas={index > 0}
                  variante="fila"
                />
              ))}
            </ul>
          </Ticket>
        </section>

        <section
          aria-labelledby="cierre"
          className="mx-auto max-w-7xl px-6 py-12 lg:py-20"
        >
          <Ticket
            className="overflow-hidden"
            talon={
              <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-8">
                <p className="text-base text-body">
                  ¿Dudas sobre tus datos?{" "}
                  <Link
                    to="/politica-de-datos"
                    className="font-medium text-link underline"
                  >
                    Lee la política de datos
                  </Link>
                  .
                </p>
                <p className="font-mono text-sm uppercase tracking-[0.14em] text-muted">
                  ESPE · Trabajo de Integración Curricular
                </p>
              </div>
            }
          >
            <div className="px-6 py-8 sm:px-8 sm:py-10">
              <h2
                id="cierre"
                className="font-display text-3xl uppercase tracking-[0.01em] text-ink sm:text-4xl"
              >
                Los escenarios son simulados. Las señales, reales.
              </h2>
              <p className="mt-3 max-w-prose text-lg leading-relaxed text-body">
                Nada de lo que decidas aquí toca tus cuentas ni tu dinero. Lo
                que sí queda contigo es haber visto la trampa antes de caer en
                ella.
              </p>
              <div className="mt-7">{primaryAction}</div>
            </div>
          </Ticket>
        </section>
      </main>
    </div>
  );
}

export default Portada;
